import { inject, bindable } from 'aurelia-framework';

@inject(Element)
export class FlashCustomAttribute {

    constructor(element) {
        this.element = element;
        this.element.classList.add('flash');
        setTimeout(() => {
            console.log(this.value);
        });
    }

    flash(className) {
        console.log(className);
        this.element.classList.add(className);
        setTimeout(() => {
            this.element.classList.remove(className);
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
