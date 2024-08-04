// message.ts

export class Message {
    private container: HTMLElement;

    constructor() {
        this.container = this.createContainer();
    }

    private createContainer(): HTMLElement {
        const container = document.createElement('div');
        container.className = 'global-message-container'; // Block class
        document.body.appendChild(container);
        return container;
    }

    public success(message: string, duration: number = 3000): void {
        this.showMessage(message, 'global-message--success', duration);
    }

    public error(message: string, duration: number = 3000): void {
        this.showMessage(message, 'global-message--error', duration);
    }

    public info(message: string, duration: number = 3000): void {
        this.showMessage(message, 'global-message--info', duration);
    }

    public warning(message: string, duration: number = 3000): void {
        this.showMessage(message, 'global-message--warning', duration);
    }

    private showMessage(message: string, type: string, duration: number): void {
        const messageElement = this.createMessageElement(message, type);
        this.container.appendChild(messageElement);

        // Add class to trigger animation
        messageElement.classList.add('global-message__item--show');

        // Fade-out
        setTimeout(() => {
            messageElement.classList.remove('global-message__item--show');
            messageElement.classList.add('global-message__item--hide');
            messageElement.addEventListener(
                'transitionend',
                () => {
                    if (messageElement.parentElement) {
                        this.container.removeChild(messageElement);
                    }
                },
                { once: true },
            );
        }, duration);
    }

    private createMessageElement(message: string, type: string): HTMLElement {
        const messageElement = document.createElement('div');
        messageElement.textContent = message;
        messageElement.className = `global-message__item ${type}`; // Element class with type modifier
        return messageElement;
    }
}
