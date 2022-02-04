import { inject } from "aurelia-framework";
import { StateService } from 'services/state-service';

@inject(Element, StateService)
export class BoardCustomElement {

    constructor(element, stateService) {
        this._element = element;
        this._stateService = stateService;
        this.isMobile = sessionStorage.getItem('isMobile') == 'true';
    }

    attached() {
        this.blockSize = this._stateService.getBlockSize();
        this._element.style.setProperty('--blockSize', this.blockSize + "vmin");
    }
}
