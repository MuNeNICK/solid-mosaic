import { render } from 'solid-js/web';
import { ExampleApp } from './ExampleApp';

const APP_ELEMENT = document.getElementById('app')!;
render(() => <ExampleApp />, APP_ELEMENT);
