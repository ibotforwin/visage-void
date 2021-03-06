import React, { Component, CSSProperties } from "react";
import CanvasWrapper from "./Canvas";
import { loadModels, getFullFaceDescription } from "../../face-api/face";
import { GridLoader } from "react-spinners";
import symbol from "../../symbol";
import { Paper } from "../atom/Paper";
import { Caption } from "../atom/Text";
import { ContextType } from "../../store/types";

type State = {
  modelsLoaded: boolean;
};

type Props = ContextType;

type StyleKey = "loader" | "textWrapper";

const styles: Record<StyleKey, CSSProperties> = {
  loader: {
    alignItems: "center",
    display: "flex",
    flexDirection: "column",
    margin: 48,
  },
  textWrapper: {
    marginBottom: 12,
  },
};

const INITITAL_STATE: State = {
  modelsLoaded: false,
};

class ImageDisplay extends Component<Props, State> {
  constructor(props) {
    super(props);
    this.state = { ...INITITAL_STATE };
  }

  componentDidUpdate = async (prevProps) => {
    const { src } = this.props.state.imageInfo;
    const { modelsLoaded } = this.state;
    if (!modelsLoaded) {
      await loadModels();
      this.setState({ ...this.state, modelsLoaded: true });
    }
    if (src && src !== prevProps.state.imageInfo.src) {
      await this.handleImage(src);
    }
  };

  handleImage = async (image) => {
    await getFullFaceDescription(image, this.props.state.inputSize).then(
      (fullDescription) => {
        if (!!fullDescription) {
          this.props.actions.updateDetections({
            fullDescription,
          });
        }
      }
    );
  };

  render() {
    const { detections, imageInfo } = this.props.state;
    if (!imageInfo.src) {
      return null;
    }
    return (
      <Paper>
        {imageInfo.src && detections && <CanvasWrapper />}
        {imageInfo.src && !detections && (
          <div style={styles.loader}>
            <div style={styles.textWrapper}>
              {this.state.modelsLoaded ? (
                <Caption>DETECTING FACES</Caption>
              ) : (
                <Caption>LOADING MODELS</Caption>
              )}
            </div>
            <GridLoader color={symbol.COLOR.text} size={20} margin={4} />
          </div>
        )}
      </Paper>
    );
  }
}

export default ImageDisplay;
