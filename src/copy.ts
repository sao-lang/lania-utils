type CopyOptions = {
    text?: string;
    imageUrl?: string;
};

export const copy = async (options: CopyOptions): Promise<void> => {
    const { text, imageUrl } = options;

    if (text) {
        // 复制文本
        try {
            if (navigator.clipboard) {
                // 使用 Clipboard API
                await navigator.clipboard.writeText(text);
                console.log('Text copied to clipboard using Clipboard API');
            } else {
                // 使用 document.execCommand
                copyTextFallback(text);
                console.log('Text copied to clipboard using fallback method');
            }
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    } else if (imageUrl) {
        // 复制图片（Clipboard API 支持）
        try {
            if (navigator.clipboard && ClipboardItem) {
                const imageBlob = await fetch(imageUrl).then(response => response.blob());
                const clipboardItem = new ClipboardItem({ 'image/png': imageBlob });
                await navigator.clipboard.write([clipboardItem]);
                console.log('Image copied to clipboard using Clipboard API');
            } else {
                console.warn('Clipboard API not available for images');
            }
        } catch (err) {
            console.error('Failed to copy image: ', err);
        }
    } else {
        throw new Error('Either text or imageUrl must be provided');
    }
};

// 辅助函数：使用 fallback 方法复制文本
const copyTextFallback = (text: string): void => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed'; // prevent scrolling to bottom of page in MS Edge.
    document.body.appendChild(textarea);
    textarea.select();
    try {
        document.execCommand('copy');
    } catch (err) {
        console.error('Fallback: Failed to copy text:', err);
    }
    document.body.removeChild(textarea);
};
