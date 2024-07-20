"use strict";

import typechecked from "https://gustavlindberg99.github.io/Typecheck.js/min/typecheck-v1.min.js";
import {QObject} from "https://gustavlindberg99.github.io/QtLinguistWeb/qtranslator-v1.min.js";
import {Box} from "https://unpkg.com/@flatten-js/core@1.4.8/dist/main.mjs";
typechecked.add(Box);

import {refreshUI} from "../utils/async-utils.js";
import {deviceIsMobile} from "../utils/utils.js";

/**
 * Creates an HTML element with zoom buttons and a zoom slider without appending it to the DOM.
 *
 * @return The created HTML element.
 */
export function createZoomBox() /*: HTMLElement */ {
    const zoomBox = document.createElement("div");
    zoomBox.className = "zoomBox";

    const zoomOutButton = document.createElement("button");
    zoomOutButton.textContent = "-";
    zoomOutButton.title = QObject.tr("Zoom out");
    zoomBox.appendChild(zoomOutButton);

    const rangeInput = document.createElement("input");
    rangeInput.type = "range";
    rangeInput.min = 0;
    rangeInput.max = 100;
    zoomBox.appendChild(rangeInput);

    const zoomInButton = document.createElement("button");
    zoomInButton.textContent = "+";
    zoomInButton.title = QObject.tr("Zoom in");
    zoomBox.appendChild(zoomInButton);

    return zoomBox;
}
createZoomBox = typechecked(createZoomBox);

/**
 * Checks if an element has the CSS attributes set so that it can scroll.
 *
 * @param element   The element to check.
 *
 * @return True if it can scroll, false if it can't.
 */
function isScrollable(element /*: Element */) /*: Boolean */ {
    const isXScrollable = ["scroll", "auto"].includes(getComputedStyle(element).overflowX);
    const isYScrollable = ["scroll", "auto"].includes(getComputedStyle(element).overflowY);
    return isXScrollable || isYScrollable;
}

/**
 * On desktop devices, makes it possible to scroll an element by dragging it. On mobile devices, does nothing since this feature is already enabled by default.
 *
 * @param element   The element to make drag scrollable.
 */
export function makeDragScrollable(element /*: Element */) /*: void */ {
    if(!deviceIsMobile()){    //On mobile devices they're already drag scrollable by default
        element.addEventListener("mousedown", (mouseDownEvent) => {
            if(!isScrollable(element.parentElement)){
                console.warn("Calling makeDragScrollable on an element whose parent doesn't scroll");
            }
            mouseDownEvent.preventDefault();
            const x = mouseDownEvent.pageX + element.parentElement.scrollLeft;
            const y = mouseDownEvent.pageY + element.parentElement.scrollTop;
            const mousemove = (mouseMoveEvent) => {
                element.parentElement.scrollLeft = -mouseMoveEvent.pageX + x;
                element.parentElement.scrollTop = -mouseMoveEvent.pageY + y;
            };
            document.addEventListener("mousemove", mousemove);
            const mouseup = (mouseUpEvent) => {
                mousemove(mouseUpEvent);
                document.removeEventListener("mousemove", mousemove);
                document.removeEventListener("mouseup", mouseup);
            };
            document.addEventListener("mouseup", mouseup);
        });
    }
}
makeDragScrollable = typechecked(makeDragScrollable);

let oldPinchDistance = NaN, oldScaleOnMobile = NaN, previousZoomRatio = 1;

document.addEventListener("touchend", () => {
    oldPinchDistance = NaN;
    oldScaleOnMobile = NaN;
    previousZoomRatio = 1;
});

const rangeInputs /*: Map<Element, HTMLInputElement | null> */ = new Map();
const minZooms /*: Map<Element, Number | null> */ = new Map();
const maxZooms /*: Map<Element, Number> */ = new Map();
const elementsToScale /*: Map<Element, Element | null> */ = new Map();
const defaultWidths /*: Map<Element, Number | null> */ = new Map();
const defaultHeights /*: Map<Element, Number | null> */ = new Map();
const defaultXs /*: Map<Element, Number | null> */ = new Map();
const defaultYs /*: Map<Element, Number | null> */ = new Map();

/**
 * Makes an element zoomable.
 *
 * @param element           The element to make zoomable.
 * @param zoomBox           The HTML element containing the buttons and slider to zoom.
 * @param minZoom           The minimum zoom value. If null, choose automatically.
 * @param maxZoom           The maximum zoom value.
 * @param defaultX          The default scroll x.
 * @param defaultY          The default scroll y.
 * @param defaultWidth      The width of the visible area at default zoom. If null, set the default zoom to 1
 * @param defaultHeight     The height of the visible area at default zoom. If null, set the default zoom to 1
 * @param elementToScale    Must be a direct child of element. If non-null, only scale elementToScale, the other children of element are just moved.
 */
export function makeZoomable(
    element /*: Element */,
    zoomBox /*: HTMLElement | null */ = null,
    minZoom /*: Number | null */ = null,
    maxZoom /*: Number */ = 5,
    defaultX /*: Number | null */ = null,
    defaultY /*: Number | null */ = null,
    defaultWidth /*: Number | null */ = null,
    defaultHeight /*: Number | null */ = null,
    elementToScale /*: Element | null */ = null
) /*: void */ {
    if(elementToScale !== null && elementToScale.parentElement !== element){
        throw new DOMException("elementToScale must be a direct child of element");
    }

    minZooms.set(element, minZoom);
    maxZooms.set(element, maxZoom);
    elementsToScale.set(element, elementToScale);

    const onwheel = (event) => {
        if(event instanceof WheelEvent || event.touches?.length === 2){
            let currentPinchDistance = NaN;
            if(!(event instanceof WheelEvent)){
                currentPinchDistance = Math.hypot(event.touches[0].pageX - event.touches[1].pageX, event.touches[0].pageY - event.touches[1].pageY);
                oldPinchDistance ||= currentPinchDistance;
            }

            if(event.cancelable){
                event.preventDefault();
            }

            //Change the zoom
            const newScale = (oldScaleOnMobile || getZoom(element)) * (event instanceof WheelEvent ? 1 + Math.sign(event.deltaY) * -0.08 : currentPinchDistance / oldPinchDistance);
            const x = (event.clientX ?? (event.touches[0].clientX + event.touches[1].clientX) / 2) - element.parentElement.getBoundingClientRect().left;
            const y = (event.clientY ?? (event.touches[0].clientY + event.touches[1].clientY) / 2) - element.parentElement.getBoundingClientRect().top;
            setZoom(element, newScale, x, y, !(event instanceof WheelEvent));
        }
    };

    element.addEventListener("wheel", onwheel);
    element.addEventListener("touchmove", onwheel);
    element.addEventListener("touchstart", (event) => {
        if(event.touches.length === 2 && event.cancelable){
            event.preventDefault();
        }
    });
    element.addEventListener("gesturestart", (event) => {
        if(event.cancelable){
            event.preventDefault();
        }
    });

    if(zoomBox !== null){
        const rangeInput = zoomBox.querySelector("input[type=range]");
        const zoomInButton = [...zoomBox.getElementsByTagName("button")].find(it => it.textContent === "+");
        const zoomOutButton = [...zoomBox.getElementsByTagName("button")].find(it => it.textContent === "-");
        rangeInputs.set(element, rangeInput);

        zoomInButton.onclick = () => {
            changeZoom(element, 1);
        };
        zoomOutButton.onclick = () => {
            changeZoom(element, -1);
        };
        rangeInput.oninput = () => {
            const newScale = (rangeInput.value - rangeInput.min) * (maxZoom - minZoom) / (rangeInput.max - rangeInput.min) + minZoom;
            setZoom(element, newScale);
        };
    }

    defaultWidths.set(element, defaultWidth);
    defaultHeights.set(element, defaultHeight);
    defaultXs.set(element, defaultX);
    defaultYs.set(element, defaultY);
    const waitForAppendedToBodyTimer = setInterval(() => {
        if(document.body.contains(element)){
            clearInterval(waitForAppendedToBodyTimer);
            if(!isScrollable(element.parentElement)){
                console.warn("Calling makeZoomable on an element whose parent doesn't scroll");
            }
            resetZoom(element);
        }
    }, 0);
}
makeZoomable = typechecked(makeZoomable);

/**
 * Resets a zoomable element to the default zoom defined in makeZoomable.
 */
export function resetZoom(element /*: Element */) /*: void */ {
    const defaultWidth = defaultWidths.get(element);
    const defaultHeight = defaultHeights.get(element);
    const defaultX = defaultXs.get(element);
    const defaultY = defaultYs.get(element);
    if(defaultWidth === undefined || defaultHeight === undefined || defaultX === undefined || defaultY === undefined){
        throw new DOMException("Calling resetZoom on element that makeZoomable hasn't been called on");
    }

    let defaultXZoom = Infinity;
    if(defaultWidth !== null){
        defaultXZoom = element.parentElement.clientWidth / defaultWidth;
    }
    let defaultYZoom = Infinity;
    if(defaultHeight !== null){
        defaultYZoom = element.parentElement.clientHeight / defaultHeight;
    }
    let defaultZoom = Math.min(defaultXZoom, defaultYZoom);
    if(defaultZoom === Infinity){
        defaultZoom = 1;
    }

    setZoom(element, defaultZoom);
    if(defaultX !== null){
        element.parentElement.scrollLeft = defaultX * defaultZoom - element.parentElement.clientWidth / 2;
    }
    if(defaultY !== null){
        element.parentElement.scrollTop = defaultY * defaultZoom - element.parentElement.clientHeight / 2;
    }
}

/**
 * Sets the zoom of a zoomable element.
 *
 * @param element       The element to set the zoom on.
 * @param newScale      The zoom scale to set.
 * @param cursorX       The x position to zoom towards. If null, place at the center.
 * @param cursorY       The y position to zoom towards. If null, place at the center.
 * @param isPinchEvent  Whether this function was called due to a pinch event.
 */
function setZoom(
    element /*: Element */,
    newScale /*: Number */,
    cursorX /*: Number | null */ = null,
    cursorY /*: Number | null */ = null,
    isPinchEvent /*: Boolean */ = false
) /*: void */ {
    const maxZoom = maxZooms.get(element);
    if(maxZoom === undefined){
        throw new DOMException("setZoom can only be called on elements on which makeZoomable has been called before");
    }
    const minZoom = minZooms.get(element) ?? Math.min(1, Math.max(element.parentElement.clientWidth / usualSize(element).width, element.parentElement.clientHeight / usualSize(element).height));

    if(!isScrollable(element.parentElement)){
        console.warn("Calling setZoom on an element whose parent doesn't scroll");
    }

    cursorX ??= element.parentElement.clientWidth / 2;
    cursorY ??= element.parentElement.clientHeight / 2;

    const oldScale = (isPinchEvent && !Number.isNaN(oldScaleOnMobile)) ? oldScaleOnMobile : getZoom(element);
    newScale = Math.max(minZoom, Math.min(newScale, maxZoom));
    let zoomRatio = newScale / oldScale;

    //Adjust the variables for pinch events
    if(isPinchEvent){
        oldScaleOnMobile = oldScaleOnMobile || oldScale;
        zoomRatio /= previousZoomRatio;
        previousZoomRatio *= zoomRatio;
    }

    //Rescale the element
    const elementToScale = elementsToScale.get(element) ?? element;
    if(elementToScale.tagName.toLowerCase() === "svg"){
        elementToScale.setAttribute("width", elementToScale.getAttribute("width") * zoomRatio);
        elementToScale.setAttribute("height", elementToScale.getAttribute("height") * zoomRatio);
    }
    else{
        elementToScale.style.transform = "scale(" + newScale + ")";
    }

    //Set the zoom input on the correct zoom
    const rangeInput = rangeInputs.get(element);
    if(rangeInput !== null){
        rangeInput.value = (rangeInput.max - rangeInput.min) * (newScale - minZoom) / (maxZoom - minZoom) + parseFloat(rangeInput.min);
    }

    //Position the scrolling correctly
    element.parentElement.scrollLeft *= zoomRatio;
    element.parentElement.scrollLeft += cursorX * (zoomRatio - 1);
    element.parentElement.scrollTop *= zoomRatio;
    element.parentElement.scrollTop += cursorY * (zoomRatio - 1);

    //Move the elementsToMove if there are any
    if(elementsToScale.get(element) !== null){
        for(let elementToMove of element.children){
            if(elementToMove !== elementToScale){
                elementToMove.style.left = (parseFloat(elementToMove.style.left) * zoomRatio) + "px";
                elementToMove.style.top = (parseFloat(elementToMove.style.top) * zoomRatio) + "px";
            }
        }
    }
}
setZoom = typechecked(setZoom);

/**
 * Increases or decreases the zoom by the specified step.
 *
 * @param element   The element to set the zoom on.
 * @param step      The amount to change the zoom by. Zooms in if positive, zooms out if negative.
 */
function changeZoom(element /*: Element */, step /*: Number */) /*: void */ {
    setZoom(element, getZoom(element) + step * 0.08);
}
changeZoom = typechecked(changeZoom);

/**
 * Gets the zoom value of a zoomable element.
 *
 * @param element   The element to get the zoom of.
 *
 * @return The zoom value of the element.
 */
function getZoom(element /*: Element */) /*: Number */ {
    const elementToScale = elementsToScale.get(element) ?? element;
    if(elementToScale.tagName.toLowerCase() == "svg"){
        return elementToScale.getAttribute("width") / usualSize(elementToScale).width;
    }
    else{
        return parseFloat(/scale\s*\(\s*([0-9.]+)\s*\)/i.exec(elementToScale.style.transform)?.[1] ?? 1);
    }
}
getZoom = typechecked(getZoom);

/**
 * Gets the size that a zoomable element would have without zoom.
 *
 * @param element   The element to get the size of.
 *
 * @return A box where the width and height are the usual size of the element, and the x and y are always 0.
 */
function usualSize(element /*: Element */) /*: Box */ {
    const elementToScale = elementsToScale.get(element) ?? element;
    if(elementToScale.tagName.toLowerCase() == "svg"){
        const viewBox = elementToScale.getAttribute("viewBox")?.trim()?.split(/\s+/) ?? [0, 0, elementToScale.getAttribute("width"), elementToScale.getAttribute("height")];
        elementToScale.setAttribute("viewBox", viewBox.join(" "));
        return new Box(0, 0, parseFloat(viewBox[2]), parseFloat(viewBox[3]));
    }
    else{
        return new Box(0, 0, elementToScale.clientWidth, elementToScale.clientHeight);
    }
}
usualSize = typechecked(usualSize);