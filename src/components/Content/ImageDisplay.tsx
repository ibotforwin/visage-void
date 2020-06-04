import React, { Component, CSSProperties } from "react";
import CanvasWrapper from "./CanvasWrapper";
import { loadModels, getFullFaceDescription } from "../../face-api/face";
import { ContextType } from "../../types";
import { GridLoader } from "react-spinners";
import symbol from "../../symbol";
import { Paper } from "../atom/Paper";
import { Caption, Label } from "../atom/Text";
import { Button } from "../atom/Button";

type State = {
  modelsLoaded: boolean;
};

type Props = ContextType;

const styles: {
  loader: CSSProperties;
  textWrapper: CSSProperties;
} = {
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
    const { src } = this.props.context.imageInfo;
    const { modelsLoaded } = this.state;
    if (!modelsLoaded) {
      await loadModels();
      this.setState({ ...this.state, modelsLoaded: true });
    }
    if (src && src !== prevProps.context.imageInfo.src) {
      await this.handleImage(src);
    }
  };

  detectMoreImages = async () => {
    const { p5Object } = this.props.context;
    console.log(p5Object);
    console.log(this.props.context);
    if (p5Object) {
      p5Object.saveFrames("out", "jpg", 1, 1, async (data) => {
        var url = data[0].imageData;
        const blob = await fetch(url).then((res) => {
          return res.blob();
        });
        const reader = new FileReader();

        reader.onabort = () => alert("file reading was aborted");
        reader.onerror = () => alert("file reading has failed");
        reader.onload = (entry) => {
          // Do whatever you want with the file contents
          var image = new Image();

          //@ts-ignore
          image.src = entry.target.result;
          image.onload = async () => {
            const canvas = document.createElement("canvas");
            canvas.width = image.width;
            canvas.height = image.height;

            const ctx = canvas.getContext("2d");
            //@ts-ignore
            ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

            await canvas.toBlob(async (img) => {
              console.log(img);
              console.log("WALALALALAL");
              await getFullFaceDescription(URL.createObjectURL(img), 1024).then(
                (fullDescription) => {
                  console.log(fullDescription);
                  if (!!fullDescription) {
                    console.log("DETECTED");
                    const newDetections = fullDescription.map((fd) => {
                      return {
                        height: Math.round(fd.detection.box.height),
                        width: Math.round(fd.detection.box.width),
                        x: Math.round(fd.detection.box.x),
                        y: Math.round(fd.detection.box.y),
                        hide: false,
                      };
                    });
                    console.log(blob);
                    this.props.setContext({
                      ...this.props.context,
                      imageInfo: {
                        //@ts-ignore
                        ...this.props.imageInfo,
                        src: URL.createObjectURL(blob),
                      },
                      detections: [
                        //@ts-ignore
                        ...(this.props.detections ? this.props.detections : []),
                        ...newDetections,
                      ],
                      editCount: this.props.context.editCount + 1,
                    });
                  }
                }
              );
            });
          };
        };
        reader.readAsDataURL(blob);
      });
    }
  };

  handleImage = async (image) => {
    console.log(image);
    await getFullFaceDescription(image).then((fullDescription) => {
      if (!!fullDescription) {
        this.props.setContext({
          ...this.props.context,
          detections: fullDescription.map((fd) => {
            return {
              height: Math.round(fd.detection.box.height),
              width: Math.round(fd.detection.box.width),
              x: Math.round(fd.detection.box.x),
              y: Math.round(fd.detection.box.y),
              hide: false,
            };
          }),
          editCount: this.props.context.editCount + 1,
        });
      }
    });
  };

  render() {
    const { detections, imageInfo } = this.props.context;

    if (!imageInfo.src) {
      return null;
    }

    return (
      <Paper>
        <Button onClick={this.detectMoreImages}>
          <Label>DETECT MORE</Label>
        </Button>
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
