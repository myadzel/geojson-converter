geojson-converter
================

About
-------

Coordinates defined in GeoJSON objects uses WGS 84 projection (EPSG:4326).

Obsolete specifications of GeoJSON (aka GJ2008) allow to specify coordinate reference system (CRS) to use coordinates in others systems, for example, in Web Mercator projection (EPSG:3857).

This module can convert from obsolete specification (aka GJ2008) to (normal) GeoJSON and back.

Module uses proj4 library to translate coordinates (this allow to pecify the projection name and datum if necessary).

Usage example
-------

Install
>$ npm install geojson-converter


Usage to normalize GeoJSON:

```js
import {normalize} from 'geojson-converter';

const geoJsonWithCrs = {"type":"FeatureCollection","features":[{"type":"Feature","properties":{"name":"building"},"geometry":{"coordinates":[[[4327063.487520801,7530792.175331439],[4327079.9973121025,7530744.296936532],[4327110.815589298,7530753.652485012],[4327092.104492462,7530803.181859037],[4327063.487520801,7530792.175331439]]],"type":"Polygon"}}],"crs":{"type":"name","properties":{"name":"urn:ogc:def:crs:EPSG::3857"}}};

console.log(normalize(geoJsonWithCrs));

```

Usage to convert GeoJSON to obsolete schema (with crs attribute):
```js
import {obsolete} from 'geojson-converter';

const geoJson = {"type":"FeatureCollection","features":[{"type":"Feature","properties":{"name":"building"},"geometry":{"coordinates":[[[38.87067266195456,55.86098927010207],[38.8708209719332,55.860747896682426],[38.871097817227536,55.86079506172163],[38.87092973258484,55.861044758032676],[38.87067266195456,55.86098927010207]]],"type":"Polygon"}}]};

console.log(obsolete(geoJson, 'EPSG:102018', '+proj=gnom +lat_0=90 +lon_0=0 +x_0=6300000 +y_0=6300000 +ellps=WGS84 +datum=WGS84 +units=m +no_defs'));

```

License
-------

MIT