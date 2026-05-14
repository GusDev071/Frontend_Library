import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-alert-dialog',
  templateUrl: './alert-dialog.html',
  styleUrl: './alert-dialog.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AlertDialog {

   readonly isOpen = input(false);
  readonly title = input('Alerta');
  readonly message = input('Mensaje');
  readonly type = input<'success' | 'error' | 'warning'>('success');

  readonly confirm = output<void>();
  readonly cancel = output<void>();

  onConfirm(): void {
    this.confirm.emit();
  }

  onCancel(): void {
    this.cancel.emit();
  }

}
