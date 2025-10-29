import { Alert, Platform } from 'react-native';

type AlertButton = {
    text: string;
    onPress?: () => void;
    style?: 'default' | 'cancel' | 'destructive';
}

// Добавляем опциональный параметр type
export const showAlert = (title: string, message?: string, buttons?: AlertButton[], type: 'info' | 'success' | 'error' = 'info') => {
    // На вебе мы показываем alert ТОЛЬКО для ошибок.
    if (Platform.OS === 'web') {
        // Если это уведомление об успехе - просто ничего не делаем.
        if (type === 'success') {
            console.log(`Success Alert (suppressed on web): ${title} - ${message}`);
            return;
        }

        if (buttons && buttons.length > 1) {
            if (confirm(`${title}\n\n${message}`)) {
                const okButton = buttons.find(b => b.style !== 'cancel');
                okButton?.onPress?.();
            } else {
                const cancelButton = buttons.find(b => b.style === 'cancel');
                cancelButton?.onPress?.();
            }
        } else {
            alert(`${title}\n\n${message}`);
        }
    } else {
        // На мобильных устройствах показываем все уведомления
        Alert.alert(title, message, buttons);
    }
};