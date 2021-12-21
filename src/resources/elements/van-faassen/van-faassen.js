import { inject, bindable } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';
import { StateService } from 'services/state-service';

@inject(Element, EventAggregator, StateService)
export class VanFaassen {
    @bindable position;
    @bindable index;
    constructor(element, eventAggregator, stateService) {
        this._element = element;
        this._eventAggregator = eventAggregator;
        this._stateService = stateService
        this.showMe = false;
        this.inYourFace = false;
    }
    attached() {
        this._winSubscription = this._eventAggregator.subscribe('win', _ => {
            this.inYourFace = false;
            this.showMe = false;
            this.state = 0;
        });
        this._giveUpSubscription = this._eventAggregator.subscribe('giveUp', _ => {
            this.inYourFace = false;
            this.showMe = false;
            this.state = 0;
        });
        this._followMeSubscription = this._eventAggregator.subscribe('followMe', data => {
            if (data.index == this.index) {
                this.position = data.position;
                this._stateService.moveFaassen(this.index, this.position);
            }
        });
        this.blockSize = this._stateService.getBlockSize();
        this.showMe = true;
        setTimeout(() => {
            this.sayHi();
        });
    }
    detached() {
        this._winSubscription.dispose();
        this._giveUpSubscription.dispose();
        this._followMeSubscription.dispose();
    }
    sayHi() {
        this._element.addEventListener('animationend', _ => {
            this.inYourFace = false;
        });
        this.inYourFace = true;
    }
}
