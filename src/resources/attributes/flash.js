import { inject, bindable } from 'aurelia-framework';

@inject(Element)
export class FlashCustomAttribute {

    constructor(element) {
        this._element = element;
        this._element.classList.add('flash');
    }

    flash(className) {
        if (this._flasTimeoutHandle) {
            clearTimeout(this._flasTimeoutHandle);
            this._element.classList.remove('flash--in', 'flash--out');
        }
        this._element.classList.add(className);
        this._flasTimeoutHandle = setTimeout(_ => {
            this._element.classList.remove(className);
        }, 250);
    }

    valueChanged(newValue, oldValue) {
        if (parseInt(newValue, 10) > parseInt(oldValue)) {
            this.flash('flash--in');
        } else {
            this.flash('flash--out');
        }
    }
}
