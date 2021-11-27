import { inject } from "aurelia-framework";
import { EventAggregator } from 'aurelia-event-aggregator';

@inject(EventAggregator)
export class BoardCustomElement {

    bricks = [];
    bricksCount = 3;

    constructor(eventAggregator) {
        this._eventAggregator = eventAggregator;
    }

    attached() {
        this._scatterBricks();
        // this._bricksReadySubscriber = this._eventAggregator.subscribe('bricksReady', _ => {
        // });
    }

    detached() {
        this._bricksReadySubscriber.dispose();
    }

    _scatterBricks() {
        for (let i = 0; i < this.bricksCount; i++) {
            const brick = {
                index: i,
                position = {
                    left: Math.round(Math.random() * 100),
                    top: Math.round(Math.random() * 100)
                }
            }
            this.bricks.push(brick);
        }
    }

}
