import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, Signal, ViewChild, effect, Injector } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { WebsocketService } from '../../services/websocket.service';
import { SystemData, DeviceInfo, BatteryInfo, TemperatureInfo } from '../../types/system';
import { toSignal } from '@angular/core/rxjs-interop';
import { SystemResourcesComponent } from '../system-resources/system-resources.component';
import { ProcessListComponent } from '../process-list/process-list.component';
import { ProotListComponent } from '../proot-list/proot-list.component';

interface NavItem {
    id: 'overview' | 'processes' | 'terminal' | 'proot';
    label: string;
    icon: string;
}

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, FormsModule, SystemResourcesComponent, ProcessListComponent, ProotListComponent],
    templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit, OnDestroy {
    @Input({ required: true }) serverUrl!: string;
    @Input({ required: true }) token!: string;
    @Input({ required: true }) username!: string;
    @Output() logout = new EventEmitter<void>();
    @ViewChild(ProotListComponent) prootListComponent?: ProotListComponent;

    currentView: NavItem['id'] = 'overview';
    distroName = '';
    distroPort = '8022';
    isCreating = false;
    createSuccess: string | null = null;
    createError: string | null = null;
    terminalUrl: string | null = null;
    safeTerminalUrl: SafeResourceUrl | null = null;
    loadingTerminal = false;

    systemData: Signal<SystemData | null> = toSignal(this.ws.systemData$, { initialValue: null });
    deviceInfo: Signal<DeviceInfo | null> = toSignal(this.ws.deviceInfo$, { initialValue: null });
    batteryInfo: Signal<BatteryInfo | null> = toSignal(this.ws.batteryInfo$, { initialValue: null });
    temperatureInfo: Signal<TemperatureInfo | null> = toSignal(this.ws.temperatureInfo$, { initialValue: null });
    isConnected: Signal<boolean> = toSignal(this.ws.isConnected$, { initialValue: false });

    private refreshIntervalId: ReturnType<typeof setInterval> | null = null;

    navItems: NavItem[] = [
        { id: 'overview', label: 'Resumen', icon: 'fa-solid fa-chart-line' },
        { id: 'processes', label: 'Procesos y Puertos', icon: 'fa-solid fa-list-check' },
        { id: 'terminal', label: 'Terminal', icon: 'fa-solid fa-terminal' },
        { id: 'proot', label: 'Crear instancia', icon: 'fa-solid fa-plus-circle' }
    ];

    constructor(private ws: WebsocketService, private injector: Injector, private sanitizer: DomSanitizer) {
        // Set up effect within injection context
        effect(() => {
            if (this.isConnected()) {
                this.fetchInfo();
                if (!this.refreshIntervalId) {
                    this.refreshIntervalId = setInterval(() => this.fetchInfo(), 30000);
                }
            }
        }, { injector: this.injector });
    }

    ngOnInit(): void {
        this.ws.connect(this.serverUrl, this.token);
    }

    ngOnDestroy(): void {
        if (this.refreshIntervalId) {
            clearInterval(this.refreshIntervalId);
        }
        this.ws.disconnect();
    }

    private async fetchInfo() {
        await Promise.all([
            this.ws.fetchDeviceInfo(),
            this.ws.fetchBatteryInfo(),
            this.ws.fetchTemperatureInfo()
        ]);
    }

    async selectView(view: NavItem['id']) {
        this.currentView = view;
        if (view === 'terminal') {
            await this.loadTerminalUrl();
        }
    }

    async loadTerminalUrl() {
        this.loadingTerminal = true;
        try {
            const res = await fetch(`${this.serverUrl}/api/terminal/url`, {
                headers: { Authorization: `Bearer ${this.token}` }
            });
            if (res.ok) {
                const data = await res.json();
                this.terminalUrl = data.url;
                this.safeTerminalUrl = this.sanitizer.bypassSecurityTrustResourceUrl(data.url);
            } else {
                this.terminalUrl = null;
                this.safeTerminalUrl = null;
            }
        } catch (err) {
            console.error('terminal url error', err);
            this.terminalUrl = null;
            this.safeTerminalUrl = null;
        } finally {
            this.loadingTerminal = false;
        }
    }

    async handleCreateInstance() {
        this.createError = null;
        this.createSuccess = null;
        if (!this.distroName.trim() || !this.distroPort.trim()) {
            this.createError = 'Completa nombre y puerto';
            return;
        }
        this.isCreating = true;
        try {
            const response = await fetch(`${this.serverUrl}/api/proot/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${this.token}`
                },
                body: JSON.stringify({ name: this.distroName.trim(), port: Number(this.distroPort) })
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data?.error || 'No se pudo crear la instancia');
            }
            this.createSuccess = `Instancia creada: ${data?.name || this.distroName} en puerto ${data?.port || this.distroPort}`;
            this.distroName = '';
            this.distroPort = '8022';
            // Refrescar la lista de instancias proot automáticamente
            if (this.prootListComponent) {
                this.prootListComponent.fetchList();
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Error inesperado al crear la instancia';
            this.createError = message;
        } finally {
            this.isCreating = false;
            setTimeout(() => {
                this.createSuccess = null;
                this.createError = null;
            }, 4000);
        }
    }

    async handleLogout() {
        this.logout.emit();
    }
}
