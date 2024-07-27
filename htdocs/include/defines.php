<?php
require_once($_SERVER['DOCUMENT_ROOT'] . '/include/setup.php');

//Version and app name
define('VERSION', '7.0.1');
define('APPNAME', 'Map Collector');
define('STYLEDAPPNAME', '<span>Map</span><span>Collector</span>');
define('COPYRIGHTSTART', 2019);

//Browser
abstract class Browser{
    const Unknown = 0x0;
    const Chrome = 0x1;
    const Firefox = 0x2;
    const Edge = 0x3;
    const Safari = 0x4;
    const Opera = 0x5;
    const InternetExplorer = 0x6;
    const OperaMini = 0x7;
    const SearchBot = 0x8;
    const AndroidApp = 0x9;
}

define('LEAST_SUPPORTED_VERSION', [
    Browser::Unknown => 0,
    Browser::Chrome => 84,
    Browser::Firefox => 90,
    Browser::Edge => 84,
    Browser::Safari => 13,
    Browser::Opera => 70,
    Browser::InternetExplorer => INF,
    Browser::OperaMini => INF,
    Browser::SearchBot => 0,
    Browser::AndroidApp => 0
]);

if(($_SERVER['HTTP_X_REQUESTED_WITH'] ?? '') == 'AndroidApp'){
    define('BROWSER', Browser::AndroidApp);
    if(preg_match('/^Map Collector Android mobile app version ([0-9]+)\.([0-9]+)\.([0-9]+)$/i', $_SERVER['HTTP_USER_AGENT'], $v)){
        define('BROWSER_VERSION', 1000000 * (int)$v[1] + 1000 * (int)$v[2] + (int)$v[3]);    //We need to multiply by large numbers because it must be an int (otherwise the < or > operators might screw up) so we can't have any dots anywhere, but for the app the exact version is very important
    }
    else{
        define('BROWSER_VERSION', 0);
    }
}
else if(!isset($_SERVER['HTTP_USER_AGENT'])){
    define('BROWSER', Browser::Unknown);
    define('BROWSER_VERSION', 0);
}
else if(preg_match('/bot|crawl|slurp|spider|mediapartners/i', $_SERVER['HTTP_USER_AGENT'])){
    define('BROWSER', Browser::SearchBot);
    define('BROWSER_VERSION', 0);
}
else if(preg_match('/Opera Mini/i', $_SERVER['HTTP_USER_AGENT'])){
    define('BROWSER', Browser::OperaMini);
    define('BROWSER_VERSION', 0);    //We don't care about the browser version for outdated browsers
}
else if(preg_match('/(?:Opera|OPR)[\/\s]([0-9]+)/i', $_SERVER['HTTP_USER_AGENT'], $v)){
    define('BROWSER', Browser::Opera);
    define('BROWSER_VERSION', (int)$v[1]);
}
else if(preg_match('/MSIE|Internet Explorer|Trident\/7\.0.*rv:11\.0/i', $_SERVER['HTTP_USER_AGENT'])){
    define('BROWSER', Browser::InternetExplorer);
    define('BROWSER_VERSION', 0);    //We don't care about the browser version for outdated browsers
}
else if(preg_match('/Edge/i', $_SERVER['HTTP_USER_AGENT'])){
    define('BROWSER', Browser::Edge);
    define('BROWSER_VERSION', 18);    //Any version of Edge between 12 and 18
}
else if(preg_match('/Edg[\/\s]([0-9]+)/i', $_SERVER['HTTP_USER_AGENT'], $v)){
    define('BROWSER', Browser::Edge);
    define('BROWSER_VERSION', (int)$v[1]);
}
else if(preg_match('/Chrome[\/\s]([0-9]+)/i', $_SERVER['HTTP_USER_AGENT'], $v)){
    define('BROWSER', Browser::Chrome);
    define('BROWSER_VERSION', (int)$v[1]);
}
else if(preg_match('/Version[\/\s]([0-9]+).*Safari/i', $_SERVER['HTTP_USER_AGENT'], $v)){
    define('BROWSER', Browser::Safari);
    define('BROWSER_VERSION', (int)$v[1]);
}
else if(preg_match('/Firefox[\/\s]([0-9]+)/i', $_SERVER['HTTP_USER_AGENT'], $v)){
    define('BROWSER', Browser::Firefox);
    define('BROWSER_VERSION', (int)$v[1]);
}
else{
    define('BROWSER', Browser::Unknown);
    define('BROWSER_VERSION', 0);
}

//Make GET parameters case insensitive
foreach($_GET as $key => $value){
    $_GET[strtolower($key)] = $value;
}

//Other stuff
define('DEVICEISMOBILE', isset($_SERVER['HTTP_USER_AGENT']) && (preg_match('/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i', $_SERVER['HTTP_USER_AGENT']) || preg_match('/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i', substr($_SERVER['HTTP_USER_AGENT'], 0, 4))));

define('IS_LOCALHOST', !filter_var($_SERVER['REMOTE_ADDR'], FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE));
define('STATIC_DOMAIN', IS_LOCALHOST ? 'http://mapcollector.github.test' : 'https://gustavlindberg99.github.io/MapCollector');
define('ASYNC_CSS', 'media="none" onload="this.media=\'all\'"');
