import {
  Component,
  ContentChild,
  Input,
  ViewChild,
  type AfterViewInit,
  ViewEncapsulation,
} from '@angular/core';
import type { ElementRef } from '@angular/core';
import { ResizeSensor } from 'css-element-queries';

import { EventDisplayService } from '../../../services/event-display.service';

/**
 * Component for overlay panel.
 */
@Component({
  standalone: false,
  selector: 'app-overlay',
  templateUrl: './overlay.component.html',
  styleUrls: ['./overlay.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class OverlayComponent implements AfterViewInit {
  /** Title of the overlay. */
  @Input() overlayTitle: string;
  /** If the overlay is open or not. */
  @Input() active: boolean = false;
  /** Icon of the overlay header. */
  @Input() icon: string;
  /** If the overlay is resizable. */
  @Input() resizable: boolean = false;
  /** If the overlay body is transparent or not. */
  @Input() transparentBody: boolean = false;
  /** If the aspect ratio is kept fixed or not. */
  @Input() keepAspectRatioFixed: boolean = false;
  /** If the overlay body is visible or not. */
  showBody: boolean = true;
  /** Aspect ratio of the overlay view. */
  aspectRatio: number = window.innerWidth / window.innerHeight;

  // ********************************************************************************
  // * Below code is specific to the overlay resize feature. (LOOK INTO CSS RESIZE) *
  // ********************************************************************************

  /** Complete overlay card containing both header and body. */
  @ViewChild('overlayCard') overlayCard: ElementRef;
  /** Handle for resizing the overlay. */
  @ViewChild('resizeHandleCorner') resizeHandleCorner: ElementRef;

  /** reference for the overlay. picked from ng-content */
  @ContentChild('overlayWindow') overlayWindow!: ElementRef<HTMLCanvasElement>;

  /** Minimum resizable width. */
  private MIN_RES_WIDTH: number = 300;
  /** Minimum resizable height */
  private MIN_RES_HEIGHT: number = 100;

  constructor(private eventDisplay: EventDisplayService) {}
  /**
   * Move the resizable handle to the bottom right after the component is created.
   */
  ngAfterViewInit() {
    if (this.resizable) {
      const resizeHandleElement = this.resizeHandleCorner.nativeElement;
      resizeHandleElement.style.bottom = '0';
      resizeHandleElement.style.right = '0';

      new ResizeSensor(this.overlayCard.nativeElement, () => {
        this.resetHandlePosition();
      });

      window.addEventListener('resize', () => {
        this.resetHandlePosition();
      });
    }
  }

  /**
   * Resize the overlay card when the resize handle is dragged.
   */
  onResize() {
    const resizeHandleElement = this.resizeHandleCorner.nativeElement;
    const overlayCardElement = this.overlayCard.nativeElement;

    const dragRect = resizeHandleElement.getBoundingClientRect();
    const overlayRect = overlayCardElement.getBoundingClientRect();

    const width = dragRect.left - overlayRect.left + dragRect.width;
    let height = dragRect.top - overlayRect.top + dragRect.height;

    this.setHandleTransform(overlayRect, dragRect);

    if (width > this.MIN_RES_WIDTH && height > this.MIN_RES_HEIGHT) {
      if (this.keepAspectRatioFixed) {
        height = width / this.aspectRatio;
      }

      const oldratioW = width / this.overlayWindow.nativeElement.width;
      const oldratioH = height / this.overlayWindow.nativeElement.height;
      this.eventDisplay
        .getThreeManager()
        .getOverlayRenderer()
        .setSize(width, height);
      this.eventDisplay
        .getThreeManager()
        .syncOverlayViewPort(oldratioW, oldratioH);
    }
  }

  /**
   * Reset resize handle position.
   */
  resetHandlePosition() {
    const resizeHandleElement = this.resizeHandleCorner.nativeElement;

    this.setHandleTransform(
      this.overlayCard.nativeElement.getBoundingClientRect(),
      resizeHandleElement.getBoundingClientRect(),
    );

    resizeHandleElement.style.bottom = null;
    resizeHandleElement.style.right = null;
  }

  /**
   * Set the position of the resize handle using transform3d.
   * @param overlayRect Bounding client rectangle of the overlay card.
   * @param dragRect Bounding client rectangle of the resize handle.
   */
  private setHandleTransform(overlayRect: any, dragRect: any) {
    const translateX = overlayRect.width - dragRect.width;
    const translateY = overlayRect.height - dragRect.height;
    this.resizeHandleCorner.nativeElement.style.transform = `translate3d(${translateX}px, ${translateY}px, 0)`;
  }
}
