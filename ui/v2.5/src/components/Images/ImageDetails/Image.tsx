import { Tab, Nav, Dropdown } from "react-bootstrap";
import React, { useEffect, useState } from "react";
import { useParams, useHistory, Link } from "react-router-dom";
import {
  useFindImage,
  useImageIncrementO,
  useImageDecrementO,
  useImageResetO,
  useImageUpdate,
  mutateMetadataScan,
} from "src/core/StashService";
import { ErrorMessage, LoadingIndicator, Icon } from "src/components/Shared";
import { useToast } from "src/hooks";
import { TextUtils } from "src/utils";
import * as Mousetrap from "mousetrap";
import { OCounterButton } from "src/components/Scenes/SceneDetails/OCounterButton";
import { OrganizedButton } from "src/components/Scenes/SceneDetails/OrganizedButton";
import { ImageFileInfoPanel } from "./ImageFileInfoPanel";
import { ImageEditPanel } from "./ImageEditPanel";
import { ImageDetailPanel } from "./ImageDetailPanel";
import { DeleteImagesDialog } from "../DeleteImagesDialog";

interface IImageParams {
  id?: string;
}

export const Image: React.FC = () => {
  const { id = "new" } = useParams<IImageParams>();
  const history = useHistory();
  const Toast = useToast();

  const { data, error, loading } = useFindImage(id);
  const image = data?.findImage;
  const [oLoading, setOLoading] = useState(false);
  const [incrementO] = useImageIncrementO(image?.id ?? "0");
  const [decrementO] = useImageDecrementO(image?.id ?? "0");
  const [resetO] = useImageResetO(image?.id ?? "0");

  const [updateImage] = useImageUpdate();

  const [organizedLoading, setOrganizedLoading] = useState(false);

  const [activeTabKey, setActiveTabKey] = useState("image-details-panel");

  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState<boolean>(false);

  async function onRescan() {
    if (!image) {
      return;
    }

    await mutateMetadataScan({
      paths: [image.path],
    });

    Toast.success({ content: "Rescanning image" });
  }

  const onOrganizedClick = async () => {
    try {
      setOrganizedLoading(true);
      await updateImage({
        variables: {
          input: {
            id: image?.id ?? "",
            organized: !image?.organized,
          },
        },
      });
    } catch (e) {
      Toast.error(e);
    } finally {
      setOrganizedLoading(false);
    }
  };

  const onIncrementClick = async () => {
    try {
      setOLoading(true);
      await incrementO();
    } catch (e) {
      Toast.error(e);
    } finally {
      setOLoading(false);
    }
  };

  const onDecrementClick = async () => {
    try {
      setOLoading(true);
      await decrementO();
    } catch (e) {
      Toast.error(e);
    } finally {
      setOLoading(false);
    }
  };

  const onResetClick = async () => {
    try {
      setOLoading(true);
      await resetO();
    } catch (e) {
      Toast.error(e);
    } finally {
      setOLoading(false);
    }
  };

  function onDeleteDialogClosed(deleted: boolean) {
    setIsDeleteAlertOpen(false);
    if (deleted) {
      history.push("/images");
    }
  }

  function maybeRenderDeleteDialog() {
    if (isDeleteAlertOpen && image) {
      return (
        <DeleteImagesDialog selected={[image]} onClose={onDeleteDialogClosed} />
      );
    }
  }

  function renderOperations() {
    return (
      <Dropdown>
        <Dropdown.Toggle
          variant="secondary"
          id="operation-menu"
          className="minimal"
          title="Operations"
        >
          <Icon icon="ellipsis-v" />
        </Dropdown.Toggle>
        <Dropdown.Menu className="bg-secondary text-white">
          <Dropdown.Item
            key="rescan"
            className="bg-secondary text-white"
            onClick={() => onRescan()}
          >
            Rescan
          </Dropdown.Item>
          <Dropdown.Item
            key="delete-image"
            className="bg-secondary text-white"
            onClick={() => setIsDeleteAlertOpen(true)}
          >
            Delete Image
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>
    );
  }

  function renderTabs() {
    if (!image) {
      return;
    }

    return (
      <Tab.Container
        activeKey={activeTabKey}
        onSelect={(k) => k && setActiveTabKey(k)}
      >
        <div>
          <Nav variant="tabs" className="mr-auto">
            <Nav.Item>
              <Nav.Link eventKey="image-details-panel">Details</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="image-file-info-panel">File Info</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="image-edit-panel">Edit</Nav.Link>
            </Nav.Item>
            <Nav.Item className="ml-auto">
              <OCounterButton
                loading={oLoading}
                value={image.o_counter || 0}
                onIncrement={onIncrementClick}
                onDecrement={onDecrementClick}
                onReset={onResetClick}
              />
            </Nav.Item>
            <Nav.Item>
              <OrganizedButton
                loading={organizedLoading}
                organized={image.organized}
                onClick={onOrganizedClick}
              />
            </Nav.Item>
            <Nav.Item>{renderOperations()}</Nav.Item>
          </Nav>
        </div>

        <Tab.Content>
          <Tab.Pane eventKey="image-details-panel">
            <ImageDetailPanel image={image} />
          </Tab.Pane>
          <Tab.Pane
            className="file-info-panel"
            eventKey="image-file-info-panel"
          >
            <ImageFileInfoPanel image={image} />
          </Tab.Pane>
          <Tab.Pane eventKey="image-edit-panel">
            <ImageEditPanel
              isVisible={activeTabKey === "image-edit-panel"}
              image={image}
              onDelete={() => setIsDeleteAlertOpen(true)}
            />
          </Tab.Pane>
        </Tab.Content>
      </Tab.Container>
    );
  }

  // set up hotkeys
  useEffect(() => {
    Mousetrap.bind("a", () => setActiveTabKey("image-details-panel"));
    Mousetrap.bind("e", () => setActiveTabKey("image-edit-panel"));
    Mousetrap.bind("f", () => setActiveTabKey("image-file-info-panel"));
    Mousetrap.bind("o", () => onIncrementClick());

    return () => {
      Mousetrap.unbind("a");
      Mousetrap.unbind("e");
      Mousetrap.unbind("f");
      Mousetrap.unbind("o");
    };
  });

  if (loading) {
    return <LoadingIndicator />;
  }

  if (error) return <ErrorMessage error={error.message} />;

  if (!image) {
    return <ErrorMessage error={`No image found with id ${id}.`} />;
  }

  return (
    <div className="row">
      {maybeRenderDeleteDialog()}
      <div className="image-tabs order-xl-first order-last">
        <div className="d-none d-xl-block">
          {image.studio && (
            <h1 className="text-center">
              <Link to={`/studios/${image.studio.id}`}>
                <img
                  src={image.studio.image_path ?? ""}
                  alt={`${image.studio.name} logo`}
                  className="studio-logo"
                />
              </Link>
            </h1>
          )}
          <h3 className="image-header">
            {image.title ?? TextUtils.fileNameFromPath(image.path)}
          </h3>
        </div>
        {renderTabs()}
      </div>
      <div className="image-container">
        <img
          className="m-sm-auto no-gutter image-image"
          alt={image.title ?? ""}
          src={image.paths.image ?? ""}
        />
      </div>
    </div>
  );
};
