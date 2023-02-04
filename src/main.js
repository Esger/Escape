import environment from './environment';
import { PLATFORM } from 'aurelia-pal';

export function configure(aurelia) {
    aurelia.use
        .standardConfiguration()
        .feature('resources')
        .plugin(PLATFORM.moduleName("aurelia-animator-css"));

    aurelia.use.developmentLogging(environment.debug ? 'debug' : 'warn');

    if (environment.testing) {
        aurelia.use.plugin('aurelia-testing');
    }

    aurelia.start().then(a => a.setRoot());
}
