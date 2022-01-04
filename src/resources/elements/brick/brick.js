import { inject, bindable } from "aurelia-framework";
import { EventAggregator } from 'aurelia-event-aggregator';
import { StateService } from 'services/state-service';
import { DirectionToVectorValueConverter } from "resources/value-converters/direction-to-vector-value-converter";

@inject(EventAggregator, StateService, DirectionToVectorValueConverter)
export class BrickCustomElement {
    @bindable brick;
    @bindable blockSize;
    visible = false;

    constructor(eventAggregator, stateService, directionToVectorValueConverter) {
        this._eventAggregator = eventAggregator;
        this._stateService = stateService;
        this._directionToVector = directionToVectorValueConverter;
        this.gameOver = false;
    }

    attached() {
        this.left = this.brick.position[0];
        this.top = this.brick.position[1];
        this._setBlocks();
        this.directionClass = ['toRight', 'toBottom', 'toLeft', 'toTop'][this.brick.direction];
        this._winSubscription = this._eventAggregator.subscribe('win', _ => {
            setTimeout(_ => {
                window.requestAnimationFrame(_ => this._hideBrick());
            }, Math.random() * 500);
        });
        this._gameStartSubscription = this._eventAggregator.subscribe('gameStart', _ => {
            this.gameOver = false;
        });
        this._giveUpSubscription = this._eventAggregator.subscribe('giveUp', _ => {
            this.gameOver = true;
        });
        this._removeSubscription = this._eventAggregator.subscribe('removeBricks', indices => {
            if (indices.includes(this.brick.index)) {
                this.brick.content = '💥';
                setTimeout(_ => this._stateService.removeBrick(this.brick.index), 300);
            }
        });
        setTimeout(() => {
            this.visible = true;
        }, Math.random() * 1000);
    }

    detached() {
        this._winSubscription.dispose();
        this._gameStartSubscription.dispose();
        this._giveUpSubscription.dispose();
        this._removeSubscription.dispose();
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
