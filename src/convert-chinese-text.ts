export const convertChinese = (text: string, dictionary: Record<string, string>): string => {
    if (!text) return text;
    const pattern = new RegExp(`[${Object.keys(dictionary).join('')}]`, 'g');
    return text.replace(pattern, char => dictionary[char] || char);
};

type ConvertOptions = {
    observeMutations?: boolean;
    batchSize?: number;
    excludeSelectors?: string[]; // 要排除的选择器
};

export const convertPageChinese = (
    dictionary: Record<string, string>,
    targetElement: HTMLElement = document.body, // 默认处理 document.body，但可以指定其他元素
    options: ConvertOptions = {}
): () => void => {
    const { observeMutations = false, batchSize = 50, excludeSelectors = [] } = options;

    let observer: MutationObserver | null = null;

    // 处理元素节点的文本属性（如 value 和 placeholder）
    const processElementText = (element: HTMLElement, dictionary: Record<string, string>): void => {
        if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
            element.value = convertChinese(element.value, dictionary);
            element.placeholder = convertChinese(element.placeholder, dictionary);
        } else if (element instanceof HTMLSelectElement) {
            Array.from(element.options).forEach(option => {
                option.text = convertChinese(option.text, dictionary);
            });
        }
    };

    // 检查节点是否应排除
    const shouldExcludeNode = (node: Node): boolean => {
        if (node.nodeType !== Node.ELEMENT_NODE) return false;
        const element = node as HTMLElement;
        return excludeSelectors.some(selector => element.matches(selector));
    };

    // 递归转换节点的文本内容
    const convertNodeTextContent = (node: Node, dictionary: Record<string, string>): void => {
        if (shouldExcludeNode(node)) return;

        if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as HTMLElement;
            const tagName = element.tagName.toLowerCase();
            // 跳过不需要处理的标签
            if (['script', 'style', 'noscript', 'iframe', 'img', 'br', 'hr', 'link'].includes(tagName)) {
                return;
            }
            // 处理元素节点的文本内容
            processElementText(element, dictionary);
        }

        if (node.nodeType === Node.TEXT_NODE) {
            node.textContent = convertChinese(node.textContent || '', dictionary);
        } else {
            Array.from(node.childNodes).forEach(childNode => convertNodeTextContent(childNode, dictionary));
        }
    };

    // 分批次处理节点的文本内容
    const convertNodeTextContentInBatches = (node: Node, dictionary: Record<string, string>): void => {
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

    // 处理指定元素及其子元素的文本内容
    const convertTargetElement = (dictionary: Record<string, string>): void => {
        convertNodeTextContentInBatches(targetElement, dictionary);
    };

    // 执行目标元素及其子元素的转换
    convertTargetElement(dictionary);

    // 监听动态内容变化并处理
    if (observeMutations) {
        observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (!shouldExcludeNode(node)) {
                        convertNodeTextContentInBatches(node, dictionary);
                    }
                });
            });
        });

        observer.observe(targetElement, { childList: true, subtree: true });
    }

    // 提供一个停止观察的方法
    return () => {
        if (observer) {
            observer.disconnect();
            observer = null;
        }
    };
};
