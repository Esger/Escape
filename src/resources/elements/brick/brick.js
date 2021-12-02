import { inject, bindable } from "aurelia-framework";
import { EventAggregator } from 'aurelia-event-aggregator';
import { DirectionToVectorValueConverter } from "resources/value-converters/direction-to-vector-value-converter";

@inject(EventAggregator, DirectionToVectorValueConverter)
export class BrickCustomElement {
    @bindable brick;
    @bindable blockSize;


    constructor(eventAggregator, directionToVectorValueConverter) {
        this._eventAggregator = eventAggregator;
        this._directionToVector = directionToVectorValueConverter;
        this.gameOver = false;
    }

    attached() {
        this._setBlocks();
        this.directionClass = ['toRight', 'toBottom', 'toLeft', 'toTop'][this.brick.direction];
        this.winSubscription = this._eventAggregator.subscribe('win', _ => {
            setTimeout(() => {
                window.requestAnimationFrame(_ => this._hideBrick());
            }, Math.random() * 1000);
        });
    }

    _hideBrick() {
        this.gameOver = true;
    }

    isOdd = (num) => { return num % 2 }

    _setBlocks() {
        this.brick.blocks = [];
        this.brick.blocks.push([0, 0]);
        this.brick.blocks.push(this._directionToVector.toView(this.brick.direction));
    }

}
