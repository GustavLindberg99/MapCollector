"use strict";

import typechecked from "https://gustavlindberg99.github.io/Typecheck.js/min/typecheck-v1.min.js";

/**
 * Gets the width needed to display the specified text.
 *
 * @param text          The text to get the width of.
 * @param fontFamily    The font family to get the width in.
 * @param fontSize      The font size to get the width in.
 * @param bold          Whether the text should be bold.
 * @param italic        Whether the text should be italic.
 *
 * @return The width in pixels.
 */
const canvas = document.createElement("canvas");
export function getTextWidth(
    text /*: String */,
    fontFamily /*: String */,
    fontSize /*: String */,
    bold /*: Boolean */ = false,
    italic /*: Boolean */ = false
) /*: Number */ {
    const context = canvas.getContext("2d");
    context.font = (bold ? "bold " : "") + (italic ? "italic " : "") + fontSize + " " + fontFamily;
    const metrics = text.split("\n").map(it => context.measureText(it));
    return Math.max(...metrics.map(it => it.width));
}
getTextWidth = typechecked(getTextWidth);

/**
 * Converts an RGB color to a hex string.
 *
 * @param r The red value of the color.
 * @param g The green value of the color.
 * @param b The blue value of the color.
 *
 * @return The hex string, starting with a # character.
 */
export function rgbToHex(r /*: Number */, g /*: Number */, b /*: Number */) /*: String */ {
    const rhex = parseInt(r).toString(16).padStart(2, "0");
    const ghex = parseInt(g).toString(16).padStart(2, "0");
    const bhex = parseInt(b).toString(16).padStart(2, "0");
    return "#" + rhex + ghex + bhex;
}
rgbToHex = typechecked(rgbToHex);

/**
 * Converts a hex string to an RGB color.
 *
 * @param hex   The hex string of the color, starting with a # character. Throws a TypeError if this is not a valid hex string.
 *
 * @return A tuple with the RGB values of the color.
 */
export function hexToRgb(hex /*: String */) /*: [Number, Number, Number] */ {
    const match = hex.match(/^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
    if(match === null){
        throw new TypeError("Invalid hex color string: " + hex);
    }
    const r = parseInt(match[1], 16);
    const g = parseInt(match[2], 16);
    const b = parseInt(match[3], 16);
    return [r, g, b];
}
hexToRgb = typechecked(hexToRgb);

/**
 * Calculates which color (black or white) is best suited to display text in on a background of a specified color.
 *
 * @param hex   The hex string of the background color, starting with a # character. Throws a TypeError if this is not a valid hex string.
 *
 * @return The hex string of the color to display on that background, starting with a # character.
 */
export function textColorOnBackground(hex /*: String */) /*: String */ {
    const [r, g, b] = hexToRgb(hex);
    return ((r * 0.299 + g * 0.587 + b * 0.114) > 130.0) ? "#000000" : "#ffffff";
}
textColorOnBackground = typechecked(textColorOnBackground);

/**
 * Gets the base 64 string for the data of an <img> element.
 *
 * @param image The <img> HTML element to convert to base 64.
 *
 * @return The base 64 encoded string.
 */
export function imgToBase64(image /*: HTMLImageElement */) /*: String */ {
    //Code from https://pqina.nl/blog/convert-an-image-to-a-base64-string-with-javascript/
    const canvas = document.createElement("canvas");

    //We use naturalWidth and naturalHeight to get the real image size vs the size at which the image is shown on the page
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;

    //We get the 2d drawing context and draw the image in the top left
    canvas.getContext("2d").drawImage(image, 0, 0);

    //Convert canvas to DataURL
    const dataURL = canvas.toDataURL();

    // Convert to Base64 string
    const base64 = dataURL.replace("data:", "").replace(/^.+,/, "");
    return base64;
}
imgToBase64 = typechecked(imgToBase64);