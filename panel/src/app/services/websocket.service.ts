import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom, timer } from 'rxjs';
import { BatteryInfo, DeviceInfo, SystemData, TemperatureInfo } from '../types/system';

@Injectable({ providedIn: 'root' })
export class WebsocketService {
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private reconnecting = false;
  private serverUrl = '';
  private token = '';

  systemData$ = new BehaviorSubject<SystemData | null>(null);
  deviceInfo$ = new BehaviorSubject<DeviceInfo | null>(null);
  batteryInfo$ = new BehaviorSubject<BatteryInfo | null>(null);
  temperatureInfo$ = new BehaviorSubject<TemperatureInfo | null>(null);
  isConnected$ = new BehaviorSubject<boolean>(false);

  constructor(private http: HttpClient) {}

  connect(serverUrl: string, token: string) {
    if (!token) return;
    this.serverUrl = serverUrl;
    this.token = token;

    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const wsUrl = serverUrl.replace(/^http/, 'ws');
    this.socket = new WebSocket(`${wsUrl}/ws?token=${token}`);

    this.socket.onopen = () => {
      this.isConnected$.next(true);
      this.reconnectAttempts = 0;
      this.socket?.send(JSON.stringify({ type: 'system:subscribe' }));
    };

    this.socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'system:data') {
          this.systemData$.next(msg.data as SystemData);
        }
      } catch (err) {
        console.error('WS parse error', err);
      }
    };

    this.socket.onerror = (err) => {
      console.error('WS error', err);
    };

    this.socket.onclose = (ev) => {
      this.isConnected$.next(false);
      this.socket = null;
      if (ev.code !== 1000 && ev.code !== 1008) {
        this.scheduleReconnect();
      }
    };
  }

  disconnect() {
    this.socket?.close();
    this.socket = null;
    this.isConnected$.next(false);
  }

  private scheduleReconnect() {
    if (this.reconnecting) return;
    this.reconnecting = true;
    const delay = Math.min(5000, 1000 * (this.reconnectAttempts + 1));
    timer(delay).subscribe(() => {
      this.reconnecting = false;
      this.reconnectAttempts += 1;
      this.connect(this.serverUrl, this.token);
    });
  }

  async fetchDeviceInfo() {
    if (!this.token) return null;
    const httpUrl = this.serverUrl.replace(/^ws/, 'http');
    try {
      const data = await firstValueFrom(
        this.http.get<DeviceInfo>(`${httpUrl}/api/system/device`, {
          headers: { Authorization: `Bearer ${this.token}` }
        })
      );
      this.deviceInfo$.next(data);
      return data;
    } catch (err) {
      console.error('device info error', err);
      return null;
    }
  }

  async fetchBatteryInfo() {
    if (!this.token) return null;
    const httpUrl = this.serverUrl.replace(/^ws/, 'http');
    try {
      const data = await firstValueFrom(
        this.http.get<BatteryInfo>(`${httpUrl}/api/system/battery`, {
          headers: { Authorization: `Bearer ${this.token}` }
        })
      );
      this.batteryInfo$.next(data);
      return data;
    } catch (err) {
      console.error('battery info error', err);
      return null;
    }
  }

  async fetchTemperatureInfo() {
    if (!this.token) return null;
    const httpUrl = this.serverUrl.replace(/^ws/, 'http');
    try {
      const data = await firstValueFrom(
        this.http.get<TemperatureInfo>(`${httpUrl}/api/system/temperatures`, {
          headers: { Authorization: `Bearer ${this.token}` }
        })
      );
      this.temperatureInfo$.next(data);
      return data;
    } catch (err) {
      console.error('temperature info error', err);
      return null;
    }
  }
}
