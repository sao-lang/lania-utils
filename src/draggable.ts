export interface DragBoundary {
    minX?: number;
    maxX?: number;
    minY?: number;
    maxY?: number;
}

export interface CustomDragEvent {
    type: 'dragstart' | 'drag' | 'dragend' | 'boundary';
    x: number;
    y: number;
}

export interface DraggableOptions {
    boundary?: DragBoundary;
    onDragStart?: (event: CustomDragEvent) => void;
    onDrag?: (event: CustomDragEvent) => void;
    onDragEnd?: (event: CustomDragEvent) => void;
    onBoundaryHit?: (event: CustomDragEvent) => void; // New callback for boundary hit
    initialPosition?: { x: number; y: number };
    enableTouch?: boolean;
    enableAnimation?: boolean;
    snapToGrid?: { x: number; y: number };
    snapThreshold?: number;
    enableSnap?: boolean;
}

export class Draggable {
    private element: HTMLElement;
    private offsetX: number = 0;
    private offsetY: number = 0;
    private isDragging: boolean = false;
    private boundary: DragBoundary;
    private onDragStart?: (event: CustomDragEvent) => void;
    private onDrag?: (event: CustomDragEvent) => void;
    private onDragEnd?: (event: CustomDragEvent) => void;
    private onBoundaryHit?: (event: CustomDragEvent) => void; // New callback
    private enableTouch: boolean;
    private enableAnimation: boolean;
    private snapToGrid: { x: number; y: number } | null = null;
    private snapThreshold: number;
    private enableSnap: boolean;
    private elementRect: DOMRect | undefined;
    private boundaryRect: DOMRect | undefined;
    private requestId: number | undefined;

    constructor(element: HTMLElement, options: DraggableOptions = {}) {
        this.element = element;
        this.boundary = options.boundary || {};
        this.onDragStart = options.onDragStart;
        this.onDrag = options.onDrag;
        this.onDragEnd = options.onDragEnd;
        this.onBoundaryHit = options.onBoundaryHit; // Initialize callback
        this.enableTouch = options.enableTouch ?? false;
        this.enableAnimation = options.enableAnimation ?? false;
        this.snapToGrid = options.snapToGrid ?? null;
        this.snapThreshold = options.snapThreshold ?? 10;
        this.enableSnap = options.enableSnap ?? false;

        if (options.initialPosition) {
            this.setPosition(options.initialPosition.x, options.initialPosition.y);
        }
    }

    public bindEvents(): void {
        this.element.addEventListener('mousedown', this.onMouseDown, { passive: true });
        document.addEventListener('mousemove', this.onMouseMove, { passive: true });
        document.addEventListener('mouseup', this.onMouseUp, { passive: true });

        if (this.enableTouch) {
            this.element.addEventListener('touchstart', this.onTouchStart, { passive: true });
            document.addEventListener('touchmove', this.onTouchMove, { passive: true });
            document.addEventListener('touchend', this.onTouchEnd, { passive: true });
        }
    }

    public unbindEvents(): void {
        this.element.removeEventListener('mousedown', this.onMouseDown);
        document.removeEventListener('mousemove', this.onMouseMove);
        document.removeEventListener('mouseup', this.onMouseUp);

        if (this.enableTouch) {
            this.element.removeEventListener('touchstart', this.onTouchStart);
            document.removeEventListener('touchmove', this.onTouchMove);
            document.removeEventListener('touchend', this.onTouchEnd);
        }
    }

    private disableTextSelection(): void {
        document.body.style.userSelect = 'none';
    }

    private enableTextSelection(): void {
        document.body.style.userSelect = '';
    }

    private onMouseDown = (e: MouseEvent) => {
        this.disableTextSelection();
        this.elementRect = this.element.getBoundingClientRect();
        this.offsetX = e.clientX - this.elementRect.left;
        this.offsetY = e.clientY - this.elementRect.top;
        this.isDragging = true;
        this.element.style.cursor = 'grabbing';
        this.onDragStart?.({ type: 'dragstart', x: e.clientX, y: e.clientY });
    };

    private onMouseMove = (e: MouseEvent) => {
        if (!this.isDragging) return;

        if (this.requestId) {
            cancelAnimationFrame(this.requestId);
        }

        this.requestId = requestAnimationFrame(() => {
            let moveX = e.clientX - this.offsetX;
            let moveY = e.clientY - this.offsetY;

            const prevX = parseFloat(this.element.style.left) || 0;
            const prevY = parseFloat(this.element.style.top) || 0;

            moveX = this.applyBoundary(moveX, 'X');
            moveY = this.applyBoundary(moveY, 'Y');

            if (this.enableSnap && this.snapToGrid) {
                moveX = this.applySnap(moveX, this.snapToGrid.x);
                moveY = this.applySnap(moveY, this.snapToGrid.y);
            }

            this.setPosition(moveX, moveY);

            if (
                (moveX !== prevX || moveY !== prevY) &&
                (moveX === this.boundary.minX ||
                    moveX === this.boundary.maxX ||
                    moveY === this.boundary.minY ||
                    moveY === this.boundary.maxY)
            ) {
                this.onBoundaryHit?.({ type: 'boundary', x: moveX, y: moveY });
            }

            this.onDrag?.({ type: 'drag', x: e.clientX, y: e.clientY });
        });
    };

    private onMouseUp = (e: MouseEvent) => {
        if (!this.isDragging) return;

        this.isDragging = false;
        this.element.style.cursor = 'grab';
        this.onDragEnd?.({ type: 'dragend', x: e.clientX, y: e.clientY });
        this.enableTextSelection();
    };

    private onTouchStart = (e: TouchEvent) => {
        e.preventDefault();
        this.elementRect = this.element.getBoundingClientRect();
        this.offsetX = e.touches[0].clientX - this.elementRect.left;
        this.offsetY = e.touches[0].clientY - this.elementRect.top;
        this.isDragging = true;
        this.element.style.cursor = 'grabbing';
        this.onDragStart?.({ type: 'dragstart', x: e.touches[0].clientX, y: e.touches[0].clientY });
    };

    private onTouchMove = (e: TouchEvent) => {
        if (!this.isDragging) return;

        if (this.requestId) {
            cancelAnimationFrame(this.requestId);
        }

        this.requestId = requestAnimationFrame(() => {
            let moveX = e.touches[0].clientX - this.offsetX;
            let moveY = e.touches[0].clientY - this.offsetY;

            const prevX = parseFloat(this.element.style.left) || 0;
            const prevY = parseFloat(this.element.style.top) || 0;

            moveX = this.applyBoundary(moveX, 'X');
            moveY = this.applyBoundary(moveY, 'Y');

            if (this.enableSnap && this.snapToGrid) {
                moveX = this.applySnap(moveX, this.snapToGrid.x);
                moveY = this.applySnap(moveY, this.snapToGrid.y);
            }

            this.setPosition(moveX, moveY);

            if (
                (moveX !== prevX || moveY !== prevY) &&
                (moveX === this.boundary.minX ||
                    moveX === this.boundary.maxX ||
                    moveY === this.boundary.minY ||
                    moveY === this.boundary.maxY)
            ) {
                this.onBoundaryHit?.({ type: 'boundary', x: moveX, y: moveY });
            }

            this.onDrag?.({ type: 'drag', x: e.touches[0].clientX, y: e.touches[0].clientY });
        });
    };

    private onTouchEnd = (e: TouchEvent) => {
        if (!this.isDragging) return;

        this.isDragging = false;
        this.element.style.cursor = 'grab';
        this.onDragEnd?.({
            type: 'dragend',
            x: e.changedTouches[0].clientX,
            y: e.changedTouches[0].clientY,
        });
    };

    private setPosition(x: number, y: number): void {
        this.element.style.transition = this.enableAnimation
            ? 'left 0.15s ease, top 0.15s ease'
            : '';
        this.element.style.left = `${x}px`;
        this.element.style.top = `${y}px`;
    }

    private applyBoundary(value: number, axis: 'X' | 'Y'): number {
        if (!this.boundaryRect) {
            this.boundaryRect = this.calculateBoundaryRect();
        }

        const min = axis === 'X' ? this.boundaryRect.left : this.boundaryRect.top;
        const max = axis === 'X' ? this.boundaryRect.right : this.boundaryRect.bottom;
        return Math.min(Math.max(value, min), max);
    }

    private calculateBoundaryRect(): DOMRect {
        const boundaryElement = document.documentElement;
        const rect = boundaryElement.getBoundingClientRect();
        return {
            left: rect.left,
            right: rect.right,
            top: rect.top,
            bottom: rect.bottom,
        } as DOMRect;
    }

    private applySnap(value: number, grid: number): number {
        return Math.round(value / grid) * grid;
    }

    public destroy(): void {
        this.unbindEvents();
    }
}
