// message.ts

const css = `.global-message-container {
    position: fixed;
    left: 50%;
    top: 20%;
    transform: translateX(-50%);
    z-index: 1000;
    pointer-events: none;
    display: flex;
    flex-direction: column;
    align-items: center;
    max-width: 90%;
    text-align: center;
}

.global-message__item {
    padding: 12px 24px; /* Increased padding */
    margin-top: 10px;
    border-radius: 8px; /* Slightly larger radius */
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2); /* Soft shadow */
    font-size: 16px; /* Slightly larger font size */
    font-family: 'Montserrat', sans-serif;
    font-weight: 500;
    line-height: 1.4;
    max-width: 600px; /* Increased width */
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(8px);
    border: 2px solid rgba(255, 255, 255, 0.3);
    background-clip: padding-box;
    transition:
        opacity 0.4s ease,
        transform 0.4s ease;
    opacity: 0;
    transform: translateY(-10px);
}

.global-message__item--show {
    opacity: 1;
    transform: translateY(0);
}

.global-message__item--hide {
    opacity: 0;
    transform: translateY(-10px);
}

.global-message--success {
    background: rgba(76, 175, 80, 0.8); /* Lighter green */
}

.global-message--error {
    background: rgba(244, 67, 54, 0.8); /* Lighter red */
}

.global-message--info {
    background: rgba(33, 150, 243, 0.8); /* Lighter blue */
}

.global-message--warning {
    background: rgba(255, 152, 0, 0.8); /* Lighter orange */
}
`;

export class Message {
    private container: HTMLElement;

    constructor() {
        this.container = this.createContainer();
        this.addStyle();
    }

    private createContainer(): HTMLElement {
        const container = document.createElement('div');
        container.className = 'global-message-container'; // Block class
        document.body.appendChild(container);
        return container;
    }

    private addStyle() {
        let style = document.querySelector(
            `style[data-lania-utils-message]="true"`,
        );
        if (!style) {
            style = document.createElement('style');
            style.setAttribute('data-lania-utils-message', 'true');
            style.textContent = css;
            document.body.appendChild(style);
        }
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

export default Message;