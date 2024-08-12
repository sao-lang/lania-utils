export interface DragBoundary {
    minX?: number;
    maxX?: number;
    minY?: number;
    maxY?: number;
}

export interface CustomDragEvent {
    type: 'dragstart' | 'drag' | 'dragend';
    x: number;
    y: number;
}

export interface DraggableOptions {
    boundary?: DragBoundary;
    onDragStart?: (event: CustomDragEvent) => void;
    onDrag?: (event: CustomDragEvent) => void;
    onDragEnd?: (event: CustomDragEvent) => void;
    initialPosition?: { x: number; y: number };
    enableTouch?: boolean;
    enableAnimation?: boolean;
    snapToGrid?: { x: number; y: number }; // snap grid size
    snapThreshold?: number; // snap distance threshold
    enableSnap?: boolean; // enable or disable snapping
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
    private enableTouch: boolean;
    private enableAnimation: boolean;
    private lastDragTime: number = 0;
    private requestId: number | undefined;
    private elementRect: DOMRect | undefined;
    private boundaryRect: DOMRect | undefined;
    private snapToGrid: { x: number; y: number } | null = null;
    private snapThreshold: number = 10;
    private enableSnap: boolean = false;

    constructor(element: HTMLElement, options: DraggableOptions = {}) {
        this.element = element;
        this.boundary = options.boundary || {};
        this.onDragStart = options.onDragStart;
        this.onDrag = options.onDrag;
        this.onDragEnd = options.onDragEnd;
        this.enableTouch = options.enableTouch || false;
        this.enableAnimation = options.enableAnimation || false;
        this.snapToGrid = options.snapToGrid || null;
        this.snapThreshold = options.snapThreshold || 10;
        this.enableSnap = options.enableSnap || false;

        if (options.initialPosition) {
            this.setPosition(
                options.initialPosition.x,
                options.initialPosition.y,
            );
        }
    }

    public bindEvents(): void {
        this.element.addEventListener('mousedown', this.onMouseDown, {
            passive: true,
        });
        document.addEventListener('mousemove', this.onMouseMove, {
            passive: true,
        });
        document.addEventListener('mouseup', this.onMouseUp, { passive: true });

        if (this.enableTouch) {
            this.element.addEventListener('touchstart', this.onTouchStart, {
                passive: true,
            });
            document.addEventListener('touchmove', this.onTouchMove, {
                passive: true,
            });
            document.addEventListener('touchend', this.onTouchEnd, {
                passive: true,
            });
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

    private onMouseDown = (e: MouseEvent) => {
        this.elementRect = this.element.getBoundingClientRect();
        this.offsetX = e.clientX - this.elementRect.left;
        this.offsetY = e.clientY - this.elementRect.top;
        this.isDragging = true;
        this.element.style.cursor = 'grabbing';
        this.onDragStart?.({ type: 'dragstart', x: e.clientX, y: e.clientY });
    };

    private onMouseMove = (e: MouseEvent) => {
        if (!this.isDragging) return;

        const now = Date.now();
        if (
            this.throttleDelay > 0 &&
            now - this.lastDragTime < this.throttleDelay
        ) {
            return;
        }
        this.lastDragTime = now;

        if (this.requestId) {
            cancelAnimationFrame(this.requestId);
        }

        this.requestId = requestAnimationFrame(() => {
            let moveX = e.clientX - this.offsetX;
            let moveY = e.clientY - this.offsetY;

            moveX = this.applyBoundary(moveX, 'X');
            moveY = this.applyBoundary(moveY, 'Y');

            if (this.enableSnap && this.snapToGrid) {
                moveX = this.applySnap(moveX, this.snapToGrid.x);
                moveY = this.applySnap(moveY, this.snapToGrid.y);
            }

            this.setPosition(moveX, moveY);
            this.onDrag?.({ type: 'drag', x: e.clientX, y: e.clientY });
        });
    };

    private onMouseUp = (e: MouseEvent) => {
        if (!this.isDragging) return;

        this.isDragging = false;
        this.element.style.cursor = 'grab';
        this.onDragEnd?.({ type: 'dragend', x: e.clientX, y: e.clientY });
    };

    private onTouchStart = (e: TouchEvent) => {
        e.preventDefault();
        this.elementRect = this.element.getBoundingClientRect();
        this.offsetX = e.touches[0].clientX - this.elementRect.left;
        this.offsetY = e.touches[0].clientY - this.elementRect.top;
        this.isDragging = true;
        this.element.style.cursor = 'grabbing';
        this.onDragStart?.({
            type: 'dragstart',
            x: e.touches[0].clientX,
            y: e.touches[0].clientY,
        });
    };

    private onTouchMove = (e: TouchEvent) => {
        if (!this.isDragging) return;

        const now = Date.now();
        if (
            this.throttleDelay > 0 &&
            now - this.lastDragTime < this.throttleDelay
        ) {
            return;
        }
        this.lastDragTime = now;

        if (this.requestId) {
            cancelAnimationFrame(this.requestId);
        }

        this.requestId = requestAnimationFrame(() => {
            let moveX = e.touches[0].clientX - this.offsetX;
            let moveY = e.touches[0].clientY - this.offsetY;

            moveX = this.applyBoundary(moveX, 'X');
            moveY = this.applyBoundary(moveY, 'Y');

            if (this.enableSnap && this.snapToGrid) {
                moveX = this.applySnap(moveX, this.snapToGrid.x);
                moveY = this.applySnap(moveY, this.snapToGrid.y);
            }

            this.setPosition(moveX, moveY);
            this.onDrag?.({
                type: 'drag',
                x: e.touches[0].clientX,
                y: e.touches[0].clientY,
            });
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
        if (this.enableAnimation) {
            this.element.style.transition = 'left 0.2s ease, top 0.2s ease';
        } else {
            this.element.style.transition = '';
        }
        this.element.style.left = `${x}px`;
        this.element.style.top = `${y}px`;
    }

    private applyBoundary(value: number, axis: 'X' | 'Y'): number {
        if (!this.boundaryRect) {
            this.boundaryRect = {
                left: this.boundary.minX ?? 0,
                top: this.boundary.minY ?? 0,
                right:
                    this.boundary.maxX ??
                    window.innerWidth - this.element.offsetWidth,
                bottom:
                    this.boundary.maxY ??
                    window.innerHeight - this.element.offsetHeight,
            } as DOMRect;
        }

        const min =
            axis === 'X' ? this.boundaryRect.left : this.boundaryRect.top;
        const max =
            axis === 'X' ? this.boundaryRect.right : this.boundaryRect.bottom;
        return Math.min(Math.max(value, min), max);
    }

    private applySnap(value: number, gridSize: number): number {
        const remainder = value % gridSize;
        if (remainder < this.snapThreshold) {
            return value - remainder;
        } else if (remainder > gridSize - this.snapThreshold) {
            return value + (gridSize - remainder);
        }
        return value;
    }
}
