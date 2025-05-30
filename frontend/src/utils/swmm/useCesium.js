import * as Cesium from 'cesium'
import { useViewerStore } from '@/stores/swmm/viewer'
import { getAllJunctionsAxios } from '@/apis/swmm/junction'
import { getAllConduitsAxios } from '@/apis/swmm/conduit'
import { getAllOutfallsAxios } from '@/apis/swmm/outfall'
import {
  createJunctionEntity,
  createConduitEntity,
  createOutfallEntity,
  fillClickedEntityDict,
  highlightClickedEntityColor,
} from '@/utils/swmm/entity'

export const initCesium = async (containerId) => {
  Cesium.Ion.defaultAccessToken =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJkNjQ5ODdiMy02NTIxLTQ2YWYtODJkNC0yYmIzMDdhNTRjYTkiLCJpZCI6MTU1ODM0LCJpYXQiOjE2OTMyNzIwNDh9.7oNx5xlOUJNC9qfJJ_csPvDWFXqmqFce-gxF2qFu-18'
  const viewer = new Cesium.Viewer(containerId, {
    geocoder: false, //隐藏查找控件
    homeButton: false, //隐藏视角返回初始位置按钮
    sceneModePicker: false, //隐藏视角模式3D 2D CV
    baseLayerPicker: false, //隐藏图层选择
    navigationHelpButton: false, //隐藏帮助
    animation: false, //隐藏动画控件
    timeline: false, //隐藏时间线控件
    fullscreenButton: false, //隐藏全屏
  })

  viewer.scene.setTerrain(new Cesium.Terrain(Cesium.CesiumTerrainProvider.fromIonAssetId(3263550)))

  // 开始时设置相机位置
  viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(103.77346807693011, 29.5048309132203, 100000),
    orientation: {
      heading: Cesium.Math.toRadians(0),
      pitch: Cesium.Math.toRadians(-90),
      roll: Cesium.Math.toRadians(0),
    },
  })

  // 清除默认鼠标左键点击事件
  viewer.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK)
  viewer.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK)

  // 监听鼠标点击事件
  let clickHandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)
  clickHandler.setInputAction((movement) => {
    const worldPosition = viewer.scene.pickPosition(movement.position)

    const pickedObject = viewer.scene.pick(movement.position)
    // 更新填充 clickedEntityDict 数据，为了存储和显示弹窗信息
    viewerStore.clickedEntityDict = fillClickedEntityDict(pickedObject?.id, worldPosition)
    console.log('pickedObject', pickedObject)
    console.log('lon', viewerStore.clickedEntityDict.lon)
    console.log('lat', viewerStore.clickedEntityDict.lat)
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

  // 初始化数据
  initEntities(viewer)

  // 数据共享
  const viewerStore = useViewerStore() // 获取 Pinia store 实例
  viewerStore.viewer = viewer // 将 viewer 实例存储到 Pinia 中
}

// 开启鼠标拖动事件
export const startDragHandlers = (viewer) => {
  let draggedEntity = null
  let isDragging = false
  const dragHandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)

  dragHandler.setInputAction((movement) => {
    const pickedObject = viewer.scene.pick(movement.position)
    if (Cesium.defined(pickedObject) && pickedObject.id && pickedObject.id.point) {
      draggedEntity = pickedObject
      isDragging = true
      viewer.scene.screenSpaceCameraController.enableRotate = false
    }
  }, Cesium.ScreenSpaceEventType.LEFT_DOWN)

  dragHandler.setInputAction((movement) => {
    if (!isDragging || !draggedEntity.id) return

    const ray = viewer.camera.getPickRay(movement.endPosition)
    const cartesian = viewer.scene.globe.pick(ray, viewer.scene)

    if (cartesian) {
      // 更新实体位置
      draggedEntity.id.position = cartesian
      // 更新填充 clickedEntityDict 数据，为了存储和显示弹窗信息
      const viewerStore = useViewerStore()
      viewerStore.clickedEntityDict = fillClickedEntityDict(draggedEntity.id)
    }
  }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)

  dragHandler.setInputAction(() => {
    isDragging = false
    draggedEntity = null
    viewer.scene.screenSpaceCameraController.enableRotate = true
  }, Cesium.ScreenSpaceEventType.LEFT_UP)

  return dragHandler
}

// 清除鼠标拖动事件
export const stopDragHandlers = (dragHandler) => {
  dragHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOWN)
  dragHandler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE)
  dragHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_UP)
}

// 节点初始化
const junctionsInit = async (viewer) => {
  const junctionDatas = await getAllJunctionsAxios()
  junctionDatas.forEach((junctionData) => {
    createJunctionEntity(
      viewer,
      junctionData.name,
      junctionData.lon,
      junctionData.lat,
      junctionData.elevation,
      junctionData.type,
      junctionData.depth_max,
      junctionData.depth_init,
      junctionData.depth_surcharge,
      junctionData.area_ponded,
      junctionData.has_inflow,
      junctionData.timeseries_name,
    )
  })
}

// 出口初始化
const outfallsInit = async (viewer) => {
  const outletDatas = await getAllOutfallsAxios()
  outletDatas.forEach((outfall) => {
    createOutfallEntity(
      viewer,
      outfall.name,
      outfall.lon,
      outfall.lat,
      outfall.elevation,
      outfall.type,
      outfall.kind,
      outfall.data,
    )
  })
}

// 渠道初始化
const conduitsInit = async (viewer) => {
  const conduitDatas = await getAllConduitsAxios()
  conduitDatas.forEach((conduitData) => {
    createConduitEntity(
      viewer,
      conduitData.name,
      conduitData.from_node,
      conduitData.to_node,
      conduitData.type,
      conduitData.length,
      conduitData.roughness,
      conduitData.transect,
      conduitData.shape,
      conduitData.height,
      conduitData.parameter_2,
      conduitData.parameter_3,
      conduitData.parameter_4,
    )
  })
}

export const initEntities = async (viewer) => {
  // 清除所有实体
  viewer.entities.removeAll()
  // 创建所有实体
  await junctionsInit(viewer) // 先加载节点
  await outfallsInit(viewer) // 再加载出口
  await conduitsInit(viewer) // 最后加载渠道
  // 设置默认高亮颜色
  const viewerStore = useViewerStore() // 获取 Pinia store 实例
  highlightClickedEntityColor(viewer, viewerStore.clickedEntityDict)
}
