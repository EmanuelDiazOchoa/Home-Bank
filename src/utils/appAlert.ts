import { useAlertStore, AlertButton } from "../store/alertStore";

export function showAlert(title: string, message: string = "", buttons?: AlertButton[]) {
  useAlertStore.getState().show(title, message, buttons);
}