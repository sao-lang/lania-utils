type ConvertOptions = {
    observeMutations?: boolean;
    batchSize?: number;
};

// 文本转换函数，使用正则表达式批量替换
const convertChinese = (
    text: string,
    dictionary: Record<string, string>,
): string => {
    if (!text) return text;
    const pattern = new RegExp(`[${Object.keys(dictionary).join('')}]`, 'g');
    return text.replace(pattern, (char) => dictionary[char] || char);
};

export const convertPageChinese = (
    dictionary: Record<string, string>,
    options: ConvertOptions = {},
): (() => void) => {
    const { observeMutations = false, batchSize = 50 } = options;

    let observer: MutationObserver | null = null;

    // 处理元素节点的文本属性（如 value 和 placeholder）
    const processElementText = (
        element: HTMLElement,
        dictionary: Record<string, string>,
    ): void => {
        if (
            element instanceof HTMLInputElement ||
            element instanceof HTMLTextAreaElement
        ) {
            element.value = convertChinese(element.value, dictionary);
            element.placeholder = convertChinese(element.placeholder, dictionary);
        } else if (element instanceof HTMLSelectElement) {
            Array.from(element.options).forEach((option) => {
                option.text = convertChinese(option.text, dictionary);
            });
        }
    };

    // 递归转换节点的文本内容
    const convertNodeTextContent = (
        node: Node,
        dictionary: Record<string, string>,
    ): void => {
        if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as HTMLElement;
            const tagName = element.tagName.toLowerCase();
            // 跳过不需要处理的标签
            if (
                [
                    'script',
                    'style',
                    'noscript',
                    'iframe',
                    'img',
                    'br',
                    'hr',
                    'link',
                ].includes(tagName)
            ) {
                return;
            }
            // 处理元素节点的文本内容
            processElementText(element, dictionary);
        }

        if (node.nodeType === Node.TEXT_NODE) {
            node.textContent = convertChinese(node.textContent || '', dictionary);
        } else {
            Array.from(node.childNodes).forEach((childNode) =>
                convertNodeTextContent(childNode, dictionary),
            );
        }
    };

    // 分批次处理节点的文本内容
    const convertNodeTextContentInBatches = (
        node: Node,
        dictionary: Record<string, string>,
    ): void => {
        const childNodes = Array.from(node.childNodes);
        let index = 0;

        const processNextBatch = (): void => {
            const end = Math.min(index + batchSize, childNodes.length);
            for (let i = index; i < end; i++) {
                convertNodeTextContent(childNodes[i], dictionary);
            }
            index = end;
            if (index < childNodes.length) {
                requestAnimationFrame(processNextBatch);
            }
        };

        processNextBatch();
    };

    // 处理整个文档的文本内容
    const convertDocumentBody = (dictionary: Record<string, string>): void => {
        convertNodeTextContentInBatches(document.body, dictionary);
    };

    // 执行文档转换
    convertDocumentBody(dictionary);

    // 监听动态内容变化并处理
    if (observeMutations) {
        observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    convertNodeTextContentInBatches(node, dictionary);
                });
            });
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    // 提供一个停止观察的方法
    return () => {
        if (observer) {
            observer.disconnect();
            observer = null;
        }
    };
};
