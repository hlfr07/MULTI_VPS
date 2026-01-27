import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

interface ProotEntry {
  nombreCompleto: string;
  nombre: string;
  puerto: string;
}

@Component({
  selector: 'app-proot-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './proot-list.component.html'
})
export class ProotListComponent implements OnInit {
  @Input({ required: true }) serverUrl!: string;
  @Input({ required: true }) token!: string;

  items: ProotEntry[] | null = null;
  loading = false;
  error: string | null = null;
  deleting: Record<string, boolean> = {};
  
  // Modal de instrucciones
  modalOpen = false;
  modalItem: ProotEntry | null = null;
  copied: Record<string, boolean> = {};
  terminalUrl: string | null = null;
  safeTerminalUrl: SafeResourceUrl | null = null;
  loadingTerminal = false;
  
  // Modal de confirmación de eliminación
  deleteModalOpen = false;
  deleteTarget: string | null = null;
  
  // Mensajes de acción
  actionMessage: string | null = null;
  actionError: string | null = null;

  constructor(private sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    this.fetchList();
  }

  async fetchList() {
    this.loading = true;
    this.error = null;
    try {
      const res = await fetch(`${this.serverUrl}/api/proot/list`, { headers: { Authorization: `Bearer ${this.token}` } });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || `Error ${res.status}`);
      }
      const data = await res.json();
      this.items = Array.isArray(data) ? data : [];
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Error al obtener la lista';
    } finally {
      this.loading = false;
    }
  }

  openInstructionsModal(item: ProotEntry) {
    this.modalItem = item;
    this.modalOpen = true;
    this.loadTerminalUrl();
  }

  closeInstructionsModal() {
    this.modalOpen = false;
    this.modalItem = null;
    this.terminalUrl = null;
    this.safeTerminalUrl = null;
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
      console.error('Error loading terminal URL:', err);
      this.terminalUrl = null;
      this.safeTerminalUrl = null;
    } finally {
      this.loadingTerminal = false;
    }
  }

  copyText(key: string, text: string) {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        this.copied[key] = true;
        setTimeout(() => {
          this.copied[key] = false;
        }, 1800);
      }).catch(() => {});
    }
  }

  openDeleteModal(name: string) {
    this.deleteTarget = name;
    this.deleteModalOpen = true;
  }

  closeDeleteModal() {
    this.deleteModalOpen = false;
    this.deleteTarget = null;
  }

  async performDelete() {
    if (!this.deleteTarget) return;
    
    const name = this.deleteTarget;
    this.actionMessage = null;
    this.actionError = null;
    this.deleting[name] = true;
    this.deleteModalOpen = false;

    try {
      const res = await fetch(`${this.serverUrl}/api/proot/delete/${encodeURIComponent(name)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${this.token}` }
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || `Error ${res.status}`);
      }
      this.actionMessage = `Instancia "${name}" eliminada correctamente.`;
      await this.fetchList();
      setTimeout(() => {
        this.actionMessage = null;
      }, 4000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al eliminar';
      this.actionError = msg;
      setTimeout(() => {
        this.actionError = null;
      }, 5000);
    } finally {
      this.deleting[name] = false;
      this.deleteTarget = null;
    }
  }

  getCombinedCommand(item: ProotEntry): string {
    return `screen -x ${item.nombreCompleto} || screen -S ${item.nombreCompleto} proot-distro login ${item.nombreCompleto}`;
  }

  getCloneCommand(item: ProotEntry): string {
    return `git clone <tu_repo> && cd <tu_repo> # usa puerto ${item.puerto} si aplica`;
  }

  getResumeCommand(item: ProotEntry): string {
    return `screen -r ${item.nombreCompleto}`;
  }

  getKillCommand(item: ProotEntry): string {
    return `screen -r ${item.nombreCompleto} -X quit`;
  }
}
