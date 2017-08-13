import React, { Component } from "react";
import PropTypes from "prop-types";

const MESSAGE_AUTOHIDE = 3 * 1000;
const ESC = 27;

const DEFAULT_MAP = {
  65: "LEFT",
  68: "RIGHT",
  87: "UP",
  83: "DOWN",
  80: "A",
  79: "B",
  81: "SELECT",
  69: "START",
};

const HUMAN_CODES = {
  37: 11104,
  38: 11105,
  39: 11106,
  40: 11107,
};

const EVENT_TYPE_MAP = {
  keydown: true,
  keyup: false,
};

function loadMap(key) {
  const map = localStorage.getItem(key);
  if (map) {
    try {
      return JSON.parse(map);
    } catch (e) {
      console.error("Map restore failed", e);
    }
  }
  return DEFAULT_MAP;
}

function saveMap(key, map) {
  window.localStorage.setItem(key, JSON.stringify(map));
}

function keyCodeToHuman(keyCode) {
  return HUMAN_CODES[keyCode]
    ? String.fromCharCode(HUMAN_CODES[keyCode])
    : String.fromCharCode(keyCode) || keyCode;
}

class InputMapper extends Component {
  static propTypes = {
    onInput: PropTypes.func.isRequired,
    svgURL: PropTypes.string.isRequired,
    localStorageKey: PropTypes.string.isRequired,
  };

  static defaultProps = {
    localStorageKey: "snex-react-input-mapper",
  };

  constructor(props) {
    super(props);

    this.state = {
      message: null,
      map: loadMap(props.localStorage),
      showMessage: false,
      showMap: false,
      waitingForInput: null,
    };

    this.keyOrder = [];

    this.onInput = this.onInput.bind(this);
  }

  componentDidMount() {
    window.addEventListener("keydown", this.onInput);
    window.addEventListener("keyup", this.onInput);

    this.svgNode.addEventListener("load", () => {
      this.initialize(this.svgNode.contentDocument);
    });
  }

  componentWillUnmount() {
    window.removeEventListener("keydown", this.onInput);
    window.removeEventListener("keyup", this.onInput);
  }

  initialize(svgNode) {
    this.keyOrder = [];
    const nodes = svgNode.querySelectorAll("[id]");
    for (let i = 0, node; (node = nodes[i]); ++i) {
      const id = node.getAttribute("id");
      if (id.startsWith("snex-button-")) {
        const name = id.replace("snex-button-", "");
        this.keyOrder.push(name);
        node.addEventListener("click", () => this.enableRemap(name));
      }
    }
  }

  emitMessage(message, hold = false) {
    this.setState({
      message,
      showMessage: true,
    });

    if (!hold) {
      clearTimeout(this.messageTimer);
      this.messageTimer = setTimeout(() => {
        this.cancelMessage();
      }, MESSAGE_AUTOHIDE);
    }
  }

  cancelMessage() {
    this.setState({
      showMessage: false,
    });
  }

  enableRemap(keyName) {
    const text = `Press any key to remap "${keyName}".`;
    this.emitMessage(text, true);
    this.setState({
      showMap: false,
      waitingForInput: keyName,
    });
    window.focus();
  }

  cancelRemap() {
    this.setState({
      waitingForInput: null,
    });
  }

  handleInputWhileRemapping({ keyCode }) {
    if (keyCode === ESC) {
      this.cancelMessage();
      this.cancelRemap();
      return;
    }

    const keyName = this.state.waitingForInput;
    const map = Object.assign({}, this.state.map, { [keyCode]: keyName });

    const text = `Mapped "${keyName}" to ${keyCodeToHuman(keyCode)}.`;
    this.cancelRemap();
    this.emitMessage(text, false);

    this.setState({ map });
    saveMap(this.props.localStorageKey, map);
  }

  onInput(event) {
    if (this.state.waitingForInput) {
      return this.handleInputWhileRemapping(event);
    }

    const { keyCode } = event;
    const { map } = this.state;
    if (map[keyCode]) {
      this.props.onInput({
        key: map[keyCode],
        state: EVENT_TYPE_MAP[event.type],
      });
    }
  }

  render() {
    const { map } = this.state;
    const reverseMap = Object.keys(map).reduce((reverseMap, keyCode) => {
      const key = map[keyCode];
      if (!reverseMap[key]) {
        reverseMap[key] = [];
      }
      reverseMap[map[keyCode]].push(keyCode);
      return reverseMap;
    }, {});

    return (
      <div className="snex-input-mapper" style={{ position: "relative" }}>
        <div
          className="key-map"
          style={{
            top: "50%",
            left: "50%",
            transform: [
              "translateX(-50%)",
              "translateY(-50%)",
              `rotateX(${this.state.showMap ? 0 : 90}deg)`,
            ].join(" "),
            transition: "transform 0.5s ease",
            position: "absolute",
            zIndex: 2,
          }}
        >
          <table>
            <tbody>
              {this.keyOrder.map(keyName => {
                return (
                  <tr key={keyName}>
                    <th>
                      {keyName}
                    </th>
                    <td>
                      {reverseMap[keyName]
                        .map(keyCode => keyCodeToHuman(keyCode))
                        .join(" ")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <small>
            <a
              className="hide-key-map"
              style={{ cursor: "pointer" }}
              onClick={() => this.setState({ showMap: false })}
            >
              Hide Key Map
            </a>
          </small>
        </div>

        <div className="controller" style={{ position: "relative" }}>
          <object
            data={this.props.svgURL}
            type="image/svg+xml"
            style={{
              width: "100%",
            }}
            ref={node => (this.svgNode = node)}
          />
        </div>

        <div style={{ display: "flex", position: "absolute", width: "100%" }}>
          <div
            className="message"
            style={{
              margin: "auto",
              textAlign: "center",
              top: "100%",
            }}
          >
            {this.state.showMessage
              ? this.state.message
              : <small>
                  <a
                    className="show-key-map"
                    style={{
                      cursor: "pointer",
                      opacity: this.state.showMap ? 0 : 1,
                      transition: "opacity 0.5s ease",
                    }}
                    onClick={() =>
                      this.setState({ showMap: !this.state.showMap })}
                  >
                    Show Key Map
                  </a>
                </small>}
          </div>
        </div>
      </div>
    );
  }
}

export default InputMapper;
