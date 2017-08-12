# SNEX React Input Mapper

A widget that shows a controller on screen and lets the user map visible buttons to keyboard keys. The component comes functional styles included but requires cosmetic styling for your particular project.

## Usage

* Install.
```bash
yarn add @snex/react-input-mapper
```

* Require component.
```js
import InputMapper from '@snex/react-input-mapper';
```

* Setup and render.
```jsx
<InputMapper
  svgURL='/graphics/nes.svg'
  onInput={({key, state}) => console.log(`Button ${key} is pressed`, state)}
/>
```

## Example style
```css
.App .snex-input-mapper {
    font-size: 2vh;
    margin: 0 auto;
    width: 30vw;
}

.App .snex-input-mapper .key-map {
    background: rgba(0, 0, 0, 0.5);
    border-radius: .2em;
    padding: 1em;
    text-align: left;
}
```
