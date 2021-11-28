import { inject } from 'aurelia-framework';
import { KeyInputService } from "services/key-input-service";

@inject(KeyInputService)
export class App {
    constructor(keyInputService) {
        this._keyInputService = keyInputService;
    }
}
