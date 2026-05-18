import L from "leaflet";
import goongjs from "@goongmaps/goong-js";

const GOONG_DEFAULT_STYLE =
  "https://tiles.goong.io/assets/goong_map_web.json";

type GoongMapInstance = InstanceType<typeof goongjs.Map>;

/** Leaflet marks `_map` protected; the runtime layer from `L.Layer.extend` always has it. */
function layerMap(layer: L.Layer): L.Map | null {
  return (layer as unknown as { _map: L.Map | null })._map;
}

/** Goong/Mapbox GL may expose `triggerRepaint`, `_update`, or `update` depending on version. */
function requestGoongRedraw(gl: GoongMapInstance): void {
  const g = gl as GoongMapInstance & {
    triggerRepaint?: () => void;
    update?: () => void;
    _update?: () => void;
  };
  if (typeof g.triggerRepaint === "function") {
    g.triggerRepaint();
  } else if (typeof g.update === "function") {
    g.update();
  } else if (typeof g._update === "function") {
    g._update();
  }
}

export type GoongGlLayerOptions = L.LayerOptions & {
  apiKey: string;
  /** Goong style URL; query `api_key` is appended automatically. */
  styleUrl?: string;
  /** Relative padding around the map view (fraction of map size per side). */
  padding?: number;
  /** When false, pointer events go through to Leaflet (recommended for marker popups). */
  interactive?: boolean;
  pane?: string;
  className?: string;
  updateInterval?: number;
};

interface GoongLayerThis extends L.Layer {
  options: GoongGlLayerOptions;
  _throttledUpdate: () => void;
  _glMap: GoongMapInstance | null;
  _container: HTMLDivElement;
  _offset: L.Point;
  _zooming: boolean;
  getPaneName: () => string;
  getSize: () => L.Point;
  _initContainer: () => void;
  _initGL: () => void;
  _update: () => void;
  _transformGL: (gl: GoongMapInstance) => void;
  _pinchZoom: () => void;
  _animateZoom: (e: L.ZoomAnimEvent) => void;
  _zoomStart: () => void;
  _zoomEnd: () => void;
  _transitionEnd: () => void;
  _resize: (e?: L.LeafletEvent) => void;
}

/**
 * Leaflet + Goong GL base map (vector tiles). Adapted from mapbox-gl-leaflet, using @goongmaps/goong-js.
 */
const GoongGl = L.Layer.extend({
  options: {
    apiKey: "",
    styleUrl: GOONG_DEFAULT_STYLE,
    updateInterval: 32,
    padding: 0.1,
    interactive: false,
    pane: "tilePane",
  },

  initialize(options: GoongGlLayerOptions) {
    L.setOptions(this, options);
    const self = this as GoongLayerThis;
    self._throttledUpdate = L.Util.throttle(
      self._update,
      self.options.updateInterval ?? 32,
      self,
    ) as () => void;
  },

  onAdd(map: L.Map) {
    const self = this as GoongLayerThis;
    if (!self._container) {
      self._initContainer();
    }
    const paneName = self.getPaneName();
    map.getPane(paneName).appendChild(self._container);
    self._initGL();
    self._offset = map.containerPointToLayerPoint(L.point(0, 0));

    if (map.options.zoomAnimation) {
      L.DomEvent.on(
        map["_proxy"] as HTMLElement,
        L.DomUtil.TRANSITION_END,
        self._transitionEnd,
        this,
      );
    }

    (map as L.Map & { _addZoomLimit: (layer: L.Layer) => void })._addZoomLimit(
      this,
    );
  },

  onRemove(map: L.Map) {
    const self = this as GoongLayerThis;
    const owned = layerMap(self);
    if (owned && owned["_proxy"] && owned.options.zoomAnimation) {
      L.DomEvent.off(
        owned["_proxy"] as HTMLElement,
        L.DomUtil.TRANSITION_END,
        self._transitionEnd,
        this,
      );
    }
    const paneName = self.getPaneName();
    map.getPane(paneName).removeChild(self._container);

    if (self._glMap) {
      self._glMap.remove();
      self._glMap = null;
    }
  },

  getEvents() {
    const self = this as GoongLayerThis;
    return {
      move: self._throttledUpdate,
      zoomanim: self._animateZoom,
      zoom: self._pinchZoom,
      zoomstart: self._zoomStart,
      zoomend: self._zoomEnd,
      resize: self._resize,
    };
  },

  getPaneName() {
    const self = this as GoongLayerThis;
    const pane = self.options.pane ?? "tilePane";
    return layerMap(self)?.getPane(pane) ? pane : "tilePane";
  },

  getSize() {
    const self = this as GoongLayerThis;
    return layerMap(self)!.getSize().multiplyBy(1 + (self.options.padding ?? 0) * 2);
  },

  _initContainer() {
    const self = this as GoongLayerThis;
    const m = layerMap(self)!;
    const container = (self._container = L.DomUtil.create(
      "div",
      "leaflet-gl-layer",
    ) as HTMLDivElement);
    const size = self.getSize();
    const offset = m.getSize().multiplyBy(self.options.padding ?? 0);
    container.style.width = `${size.x}px`;
    container.style.height = `${size.y}px`;
    const topLeft = m.containerPointToLayerPoint(L.point(0, 0)).subtract(
      offset,
    );
    L.DomUtil.setPosition(container, topLeft);
  },

  _initGL() {
    const self = this as GoongLayerThis;
    const m = layerMap(self)!;
    const center = m.getCenter();
    const styleBase = self.options.styleUrl ?? GOONG_DEFAULT_STYLE;
    const style = `${styleBase}${styleBase.includes("?") ? "&" : "?"}api_key=${encodeURIComponent(self.options.apiKey)}`;

    goongjs.accessToken = self.options.apiKey;

    const mapOptions = {
      container: self._container,
      style,
      center: [center.lng, center.lat] as [number, number],
      zoom: m.getZoom() - 1,
      attributionControl: false,
    };

    if (!self._glMap) {
      self._glMap = new goongjs.Map(mapOptions);
    } else {
      self._glMap.setCenter(mapOptions.center);
      self._glMap.setZoom(mapOptions.zoom);
    }

    self._glMap.transform.latRange = null;
    self._transformGL(self._glMap);

    const rawCanvas = self._glMap["_canvas"] as
      | HTMLCanvasElement
      | { canvas?: HTMLCanvasElement }
      | undefined;
    const canvas =
      rawCanvas && "canvas" in rawCanvas
        ? rawCanvas.canvas ?? (rawCanvas as HTMLCanvasElement)
        : (rawCanvas as HTMLCanvasElement);

    L.DomUtil.addClass(canvas, "leaflet-image-layer");
    L.DomUtil.addClass(canvas, "leaflet-zoom-animated");
    if (self.options.interactive) {
      L.DomUtil.addClass(canvas, "leaflet-interactive");
    }
    if (self.options.className) {
      L.DomUtil.addClass(canvas, self.options.className);
    }
  },

  _update() {
    const self = this as GoongLayerThis;
    const m = layerMap(self);
    if (!m) return;
    self._offset = m.containerPointToLayerPoint(L.point(0, 0));
    if (self._zooming) return;

    const size = self.getSize();
    const container = self._container;
    const gl = self._glMap!;
    const offset = m.getSize().multiplyBy(self.options.padding ?? 0);
    const topLeft = m
      .containerPointToLayerPoint(L.point(0, 0))
      .subtract(offset);
    L.DomUtil.setPosition(container, topLeft);
    self._transformGL(gl);

    const xRound = Math.round(size.x);
    const yRound = Math.round(size.y);

    if (
      Math.round(gl.transform.width) !== xRound ||
      Math.round(gl.transform.height) !== yRound
    ) {
      container.style.width = `${xRound}px`;
      container.style.height = `${yRound}px`;
      gl.resize();
    } else {
      requestGoongRedraw(gl);
    }
  },

  _transformGL(gl: GoongMapInstance) {
    const self = this as GoongLayerThis;
    const m = layerMap(self)!;
    const center = m.getCenter();
    const tr = gl.transform;
    tr.center = goongjs.LngLat.convert([center.lng, center.lat]);
    tr.zoom = m.getZoom() - 1;
  },

  _pinchZoom() {
    const self = this as GoongLayerThis;
    const m = layerMap(self)!;
    self._glMap!.jumpTo({
      zoom: m.getZoom() - 1,
      center: m.getCenter(),
    });
  },

  _animateZoom(e: L.ZoomAnimEvent) {
    const self = this as GoongLayerThis;
    const m = layerMap(self)!;
    const scale = m.getZoomScale(e.zoom);
    const padding = m.getSize().multiplyBy((self.options.padding ?? 0) * scale);
    const viewHalf = self.getSize().divideBy(2);
    const mapWithPane = m as L.Map & { _getMapPanePos: () => L.Point };
    const topLeft = m
      .project(e.center, e.zoom)
      .subtract(viewHalf)
      .add(mapWithPane._getMapPanePos().add(padding))
      .round();
    const offset = m
      .project(m.getBounds().getNorthWest(), e.zoom)
      .subtract(topLeft);

    const rawCanvas = self._glMap!["_canvas"] as
      | HTMLCanvasElement
      | { canvas?: HTMLCanvasElement }
      | undefined;
    const canvas =
      rawCanvas && "canvas" in rawCanvas
        ? rawCanvas.canvas ?? (rawCanvas as HTMLCanvasElement)
        : (rawCanvas as HTMLCanvasElement);

    L.DomUtil.setTransform(canvas, offset.subtract(self._offset), scale);
  },

  _zoomStart() {
    const self = this as GoongLayerThis;
    self._zooming = true;
  },

  _zoomEnd() {
    const self = this as GoongLayerThis;
    const m = layerMap(self)!;
    const scale = m.getZoomScale(m.getZoom());
    const rawCanvas = self._glMap!["_canvas"] as
      | HTMLCanvasElement
      | { canvas?: HTMLCanvasElement }
      | undefined;
    const canvas =
      rawCanvas && "canvas" in rawCanvas
        ? rawCanvas.canvas ?? (rawCanvas as HTMLCanvasElement)
        : (rawCanvas as HTMLCanvasElement);
    L.DomUtil.setTransform(canvas, undefined, scale);
    self._zooming = false;
    self._update();
  },

  _transitionEnd() {
    const self = this as GoongLayerThis;
    const m = layerMap(self)!;
    L.Util.requestAnimFrame(() => {
      const zoom = m.getZoom();
      const center = m.getCenter();
      const offset = m.latLngToContainerPoint(
        m.getBounds().getNorthWest(),
      );
      const rawCanvas = self._glMap!["_canvas"] as
        | HTMLCanvasElement
        | { canvas?: HTMLCanvasElement }
        | undefined;
      const canvas =
        rawCanvas && "canvas" in rawCanvas
          ? rawCanvas.canvas ?? (rawCanvas as HTMLCanvasElement)
          : (rawCanvas as HTMLCanvasElement);
      L.DomUtil.setTransform(canvas, offset, 1);
      self._glMap!.once("moveend", () => {
        self._zoomEnd();
      });
      self._glMap!.jumpTo({
        center,
        zoom: zoom - 1,
      });
    }, this);
  },

  _resize(_e?: L.LeafletEvent) {
    const self = this as GoongLayerThis;
    self._transitionEnd();
  },
});

export function createGoongGlLayer(options: GoongGlLayerOptions): L.Layer {
  const LayerCtor = GoongGl as unknown as new (
    opts: GoongGlLayerOptions,
  ) => L.Layer;
  return new LayerCtor(options);
}
