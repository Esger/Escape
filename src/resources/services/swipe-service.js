import { inject } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';

@inject(EventAggregator)
export class SwipeService {

    constructor(eventAggregator) {
        this._eventAggregator = eventAggregator;
        this._swipeThreshold = 5;
        this._preventDoubleAction = false;
        this.addListener('body');
    }

    addListener() {
        this._$container?.off();
        this._$container = $('body');
        this._$container.on('touchstart mousedown', event => {
            this.saveTouchstart(this.unify(event));
        }).on('touchend mouseup', event => {
            const direction = this.getDirection(this.unify(event));
            if (direction && !this._preventDoubleAction) {
                this._eventAggregator.publish('direction', direction);
                this._preventDoubleAction = true;
                setTimeout(() => {
                    this._preventDoubleAction = false;
                }, 100);
            }
        });
    }

    unify(event) {
        return event.changedTouches ? event.changedTouches[0] : event;
    }

    saveTouchstart(event) {
        this.touchStartPosition = {
            x: event.clientX,
            y: event.clientY
        };
    }

    getDirection(event) {
        const dx = event.clientX - this.touchStartPosition.x;
        const dy = event.clientY - this.touchStartPosition.y;
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);
        if (Math.max(absDx, absDy) < this._swipeThreshold) return;

        const distances = [dx, dy];
        const largestDistance = absDx > absDy ? 0 : 1;
        const direction = (Math.sign(distances[largestDistance]) * 1 + 1) / 2; // 0 or 1
        const directions = [['left', 'right'], ['up', 'down']];
        return directions[largestDistance][direction];
    }

}
