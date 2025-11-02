import {Multiline, Point, Segment} from "https://unpkg.com/@flatten-js/core@1.4.8/dist/main.mjs";

/**
 * Creates a multiline from an array of points.
 *
 * @param points    The points to use as vertices for the multiline.
 *
 * @return A multiline with only segments.
 */
export function multilineFromPoints(points: ReadonlyArray<Point>): Multiline {
    if(points.length < 2){
        throw new TypeError("Can't create a multiline from fewer than two points");
    }

    const segments: Array<Segment> = [];
    for(let i = 0; i < points.length - 1; i++){
        segments.push(new Segment(points[i], points[i + 1]));
    }
    return new Multiline(segments);
}

/**
 * Wrapper around fetch to simplify error handling (since fetch can either throw an exception or return an non-2xx status code depending on what exactly the error is, which makes error handling messy).
 *
 * @param url       The URL to make a request to.
 * @param postData  The POST data to send in a POST request, or null to make a GET request.
 *
 * @return The Response object returned by fetch, or null if the request failed (either if it got a non-2xx response or if there was a network error).
 */
export async function sendRequest(url: string, postData: URLSearchParams | null = null): Promise<Response | null> {
    //Workaround for https://issuetracker.google.com/issues/354305979 in the Android app
    if(window.Android){
        postData ??= new URLSearchParams();
        postData.append("email", window.Android.email()!!);
        postData.append("password", window.Android.hashedPassword()!!);
    }
    try{
        const options = postData === null ? {} : {
            method: "POST",
            headers: {"Content-Type":"application/x-www-form-urlencoded"},
            body: postData
        };
        const response = await fetch(url, options);
        if(Math.floor(response.status / 100) !== 2){
            const responseText = await response.text();
            const phpError = responseText.match(/<meta\s+name="php-error"\s+content="([^"]+)"\/>/)?.[1] ?? "";
            throw new Error("Server responded with status " + response.status + "\n" + phpError);
        }
        return response;
    }
    catch(e){
        console.info(`Failed to make AJAX request to ${url}: ${e instanceof Error ? e.message : "Non-error thrown"}`);
        return null;
    }
}

/**
 * Gets the domain that contains static resorces like Javascript files, CSS files or images. If it's an Android asset, includes "/assets/static".
 *
 * @return The domain including protocol and excluding the trailing slash.
 */
export function staticDomain(): string {
    const result = new Error().stack!!.match(/(https?:\/\/\/?[^\/]*).*\.js/i)!![1];
    if(result === "https://appassets.androidplatform.net"){
        return result + "/assets/static";
    }
    else if(result === "https://gustavlindberg99.github.io"){
        return result + "/MapCollector"
    }
    return result;
}

/**
 * Gets the domain that AJAX requests should be sent to.
 *
 * @return The domain including protocol and excluding the trailing slash.
 */
export function ajaxDomain(): string {
    const result = location.href.match(/(https?:\/\/\/?[^\/]*)/i)!![1];
    if(result === "https://appassets.androidplatform.net"){
        return "https://mapcollector.eu5.org";
    }
    return result;
}

/**
 * Waits the specified amount of time, then returns from the async function.
 *
 * @param ms    The time to wait in milliseconds.
 */
export async function wait(ms: number): Promise<void> {
    await new Promise(r => setTimeout(r, ms));
}


/**
 * Waits the least amount of time needed for the UI to refresh, then returns from the async function.
 */
let uiLastRefreshed = performance.now();
export async function refreshUI(): Promise<void> {
    if(performance.now() > uiLastRefreshed + 20){
        uiLastRefreshed = performance.now();
        await wait(0);
    }
}

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
    text: string,
    fontFamily: string,
    fontSize: string,
    bold: boolean = false,
    italic: boolean = false
): number {
    const context = canvas.getContext("2d")!!;
    context.font = (bold ? "bold " : "") + (italic ? "italic " : "") + fontSize + " " + fontFamily;
    const metrics = text.split("\n").map(it => context.measureText(it));
    return Math.max(...metrics.map(it => it.width));
}

/**
 * Gets the date of easter for the given year (source: https://gist.github.com/johndyer/0dffbdd98c2046f41180c051f378f343).
 *
 * @param year  The year to get easter in.
 *
 * @return A Date object with the easter date for that year.
 */
export function getEaster(year: number): Date {
    const g = year % 19;
    const c = Math.floor(year / 100);
    const h = (c - Math.floor(c / 4) - Math.floor((8 * c + 13) / 25) + 19 * g + 15) % 30;
    const i = h - Math.floor(h/28) * (1 - Math.floor(29 / (h + 1)) * Math.floor((21 - g) / 11));
    const j = (year + Math.floor(year / 4) + i + 2 - c + Math.floor(c / 4)) % 7;
    const l = i - j;
    const month = 3 + Math.floor((l + 40)/44);
    const day = l + 28 - 31 * Math.floor(month / 4);
    return new Date(Date.UTC(year, month - 1, day, 2));
}

/**
 * Checks if the current device is a mobile device by looking at the user agent.
 *
 * @return True if the device is mobile, false otherwise.
 */
export function deviceIsMobile(): boolean {
    return (
        /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(navigator.userAgent)
        || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(navigator.userAgent.substring(0, 4))
    );
}

/**
 * Gets the base 64 string for the data of an <img> element.
 *
 * @param image The <img> HTML element to convert to base 64.
 *
 * @return The base 64 encoded string.
 */
export function imgToBase64(image: HTMLImageElement): string {
    //Code from https://pqina.nl/blog/convert-an-image-to-a-base64-string-with-javascript/
    const canvas = document.createElement("canvas");

    //We use naturalWidth and naturalHeight to get the real image size vs the size at which the image is shown on the page
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;

    //We get the 2d drawing context and draw the image in the top left
    canvas.getContext("2d")!!.drawImage(image, 0, 0);

    //Convert canvas to DataURL
    const dataURL = canvas.toDataURL();

    //Convert to Base64 string
    const base64 = dataURL.replace("data:", "").replace(/^.+,/, "");
    return base64;
}

/**
 * Fixes so that it's possible to zoom with two fingers on mobile devices.
 *
 * @param panZoom   The object returned by svgPanZoom().
 * @param element   The <svg> element.
 */
export function makeSvgPanZoomMobileFriendly(panZoom: SvgPanZoom.Instance, element: SVGSVGElement): void {
    let oldPinchDistance: number | null = null;
    let oldScaleOnMobile: number | null = null;
    let previousZoomRatio: number = 1;

    element.addEventListener("touchmove", (event: TouchEvent) => {
        if(event.touches.length === 2){
            const currentPinchDistance = Math.hypot(event.touches[0].pageX - event.touches[1].pageX, event.touches[0].pageY - event.touches[1].pageY);
            oldPinchDistance ??= currentPinchDistance;

            if(event.cancelable){
                event.preventDefault();
            }

            //Change the zoom
            const newScale = panZoom.getZoom() * currentPinchDistance / oldPinchDistance;
            panZoom.zoom(newScale);
        }
    });
    element.addEventListener("touchend", () => {
        oldPinchDistance = null;
        oldScaleOnMobile = null;
        previousZoomRatio = 1;
    });

    element.addEventListener("touchstart", (event: TouchEvent) => {
        if(event.touches.length === 2 && event.cancelable){
            event.preventDefault();
        }
    });
}

/**
 * Sets a click event on the given element that works for both mouse clicks and touch screens. Only needed for elements inside the mapsheet SVG, for other elements simply setting onclick is enough.
 *
 * @param element   The element to set the click event on.
 * @param callback  The callback to set.
 */
export function setClickEvent(element: HTMLElement | SVGElement, callback: ((event: MouseEvent | Touch) => void) | null): void {
    element.onclick = callback;
    element.ontouchend = callback === null ? null : (event: TouchEvent) => {
        callback(event.changedTouches[0]);
    };
}
