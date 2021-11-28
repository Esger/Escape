import { inject } from "aurelia-framework";
import { EventAggregator } from 'aurelia-event-aggregator';

@inject(EventAggregator, Element)
export class BoardCustomElement {

    bricks = [];
    bricksCount = 10;
    blockSize = 5;

    constructor(eventAggregator, element) {
        this._element = element;
        this._eventAggregator = eventAggregator;
    }

    attached() {
        this._scatterBricks();
        this._element.style.setProperty('--blockSize', this.blockSize + "vmin");
    }

    detached() {
    }

    _randomNumberWithin(max) {
        return Math.floor(Math.random() * max);
    }

    _scatterBricks() {
        for (let i = 0; i < this.bricksCount; i++) {
            const brick = {
                index: i,
                direction: this._randomNumberWithin(4),
                position: {
                    left: this._randomNumberWithin(100 / this.blockSize) * this.blockSize,
                    top: this._randomNumberWithin(100 / this.blockSize) * this.blockSize,
                }
            }
            this.bricks.push(brick);
        }
    }

}
