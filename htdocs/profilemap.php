<?php
session_cache_limiter("public");
$_SERVER['HTTP_CACHE_CONTROL'] = 'max-age=' . 60 * 60 * 24 * 30;

require_once($_SERVER['DOCUMENT_ROOT'] . '/include/setup.php');
require_once($_SERVER['DOCUMENT_ROOT'] . '/include/error-handler.php');

require_once($_SERVER['DOCUMENT_ROOT'] . '/include/charmaps.php');
require_once($_SERVER['DOCUMENT_ROOT'] . '/include/colors.php');
require_once($_SERVER['DOCUMENT_ROOT'] . '/include/utils.php');

if(!isset($_GET['c']) || !isset($_GET['n']) || !is_numeric($_GET['n'])){
    showHttpError(400);
}

$lineLetter = array_key_exists(strtoupper($_GET['c']), $charMaps) ? strtoupper($_GET['c']) : DEFAULT_CHAR_MAP;
$map = $charMaps[$lineLetter][(int)$_GET['n'] % sizeof($charMaps[$lineLetter])];

echo "<?xml version=\"1.0\" encoding=\"UTF-8\"?>";
?>
<svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 496.158 496.158" version="1.1" viewBox="0 0 504.29002 504.29003" width="504.29001" height="504.29001">
    <defs>
        <clipPath id="a">
            <rect x="338.94" y="192.89" width="504.70001" height="338.20001" rx="11.339" ry="11.339" style="fill:#52c1e9;stroke:#000000;stroke-width:10;stroke-linecap:square"/>
        </clipPath>
    </defs>
    <g transform="translate(-330.59501,3.135003)">
        <rect style="fill:<?= $map->color ?>;stroke:#000000;stroke-width:10;stroke-linecap:square" ry="11.339" rx="11.339" height="494.29001" width="365.70001" y="1.8648" x="399.89001"/>
        <rect style="fill:#ffffff;stroke:#000000;stroke-width:10;stroke-linecap:square" clip-path="url(#a)" ry="11.339" rx="11.339" height="494.29001" width="365.70001" y="1.8648" x="399.89001"/>
        <text style="font-size:16px;font-family:sans-serif;text-align:center;dominant-baseline:auto;text-anchor:middle;fill:#000000" text-align="center" font-size="16px" dominant-baseline="auto" y="155.39037" x="585.61108">
            <tspan style="font-size:133.33000183px;fill:<?= textColorOnBackground($map->color) ?>" font-size="133.33px" y="155.39037" x="585.61108">
                <?= $lineLetter ?>
            </tspan>
        </text>
        <text style="font-size:16.47400093px;font-family:Calibri;text-align:center;dominant-baseline:auto;text-anchor:middle;fill:#000000;stroke-width:1.02960002" text-align="center" font-size="16.474px" dominant-baseline="auto" y="256.82001" x="581.59412">
                <?php
                $stations = explode("\n", $map->endStations);
                for($i = 0; $i < sizeof($stations); $i++){    //Don't use foreach here, we need $i at the end of the line <tspan style etc
                    ?>
                    <tspan style="font-size:30.20199966px;font-family:sans-serif;text-align:center;text-anchor:middle;stroke-width:1.02960002" text-align="center" font-size="30.202px" y="<?= 256.82001 + $i * 48.02414 ?>" x="581.59412">
                        <?= $stations[$i] ?>
                    </tspan>
                <?php } ?>
        </text>
    </g>
</svg>
<?php
//Put this at the end in case there's an error
header('Content-type: image/svg+xml');
header('Cache-control: public, ' . $_SERVER['HTTP_CACHE_CONTROL']);