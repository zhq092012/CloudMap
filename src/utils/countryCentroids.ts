/**
 * 各国质心坐标表（[lat, lng]）
 * ------------------------------------------------------------------
 * 由 public/world.geojson 离线计算（取每个国家最大环的 shoelace 质心），
 * key 为国家名的规范化小写形式。运行时根据文章 country 字段查表，
 * 命中则在地图对应国家位置打点；未命中（含别名）返回 null。
 *
 *   import { getCountryCenter } from "@/utils/countryCentroids";
 *   const center = getCountryCenter(article.country); // [lat, lng] | null
 */
export const COUNTRY_CENTROIDS: Record<string, [number, number]> = {
  "indonesia": [
    -0.191,
    114.019
  ],
  "malaysia": [
    3.615,
    114.721
  ],
  "chile": [
    -35.452,
    -71.246
  ],
  "bolivia": [
    -16.707,
    -64.685
  ],
  "peru": [
    -9.154,
    -74.378
  ],
  "argentina": [
    -35.177,
    -65.15
  ],
  "dhekelia sovereign base area": [
    35.018,
    33.792
  ],
  "cyprus": [
    34.911,
    32.954
  ],
  "india": [
    22.913,
    79.578
  ],
  "china": [
    36.617,
    103.806
  ],
  "israel": [
    31.448,
    34.997
  ],
  "palestine": [
    31.948,
    35.25
  ],
  "lebanon": [
    33.92,
    35.88
  ],
  "ethiopia": [
    8.623,
    39.601
  ],
  "south sudan": [
    7.284,
    30.301
  ],
  "somalia": [
    4.749,
    45.706
  ],
  "kenya": [
    0.552,
    37.821
  ],
  "malawi": [
    -13.219,
    34.289
  ],
  "united republic of tanzania": [
    -6.276,
    34.799
  ],
  "syria": [
    35.023,
    38.505
  ],
  "somaliland": [
    9.731,
    46.255
  ],
  "france": [
    46.621,
    2.452
  ],
  "suriname": [
    4.131,
    -55.911
  ],
  "guyana": [
    4.793,
    -58.98
  ],
  "south korea": [
    36.46,
    127.867
  ],
  "north korea": [
    40.152,
    127.187
  ],
  "morocco": [
    29.842,
    -8.396
  ],
  "western sahara": [
    24.233,
    -12.215
  ],
  "costa rica": [
    9.975,
    -84.192
  ],
  "nicaragua": [
    12.845,
    -85.034
  ],
  "republic of the congo": [
    -0.839,
    15.218
  ],
  "democratic republic of the congo": [
    -2.88,
    23.646
  ],
  "bhutan": [
    27.422,
    90.407
  ],
  "ukraine": [
    49.161,
    31.255
  ],
  "belarus": [
    53.532,
    28.034
  ],
  "namibia": [
    -22.129,
    17.211
  ],
  "south africa": [
    -29.009,
    25.159
  ],
  "saint martin": [
    18.078,
    -63.055
  ],
  "sint maarten": [
    18.041,
    -63.07
  ],
  "oman": [
    20.573,
    56.086
  ],
  "uzbekistan": [
    41.758,
    63.132
  ],
  "kazakhstan": [
    48.156,
    67.289
  ],
  "tajikistan": [
    38.528,
    71.016
  ],
  "lithuania": [
    55.327,
    23.894
  ],
  "brazil": [
    -10.839,
    -53.115
  ],
  "uruguay": [
    -32.798,
    -56.017
  ],
  "mongolia": [
    46.826,
    103.056
  ],
  "russia": [
    61.661,
    99.071
  ],
  "czechia": [
    49.732,
    15.314
  ],
  "germany": [
    51.087,
    10.371
  ],
  "estonia": [
    58.684,
    25.831
  ],
  "latvia": [
    56.852,
    24.909
  ],
  "norway": [
    64.239,
    14.022
  ],
  "sweden": [
    62.83,
    16.744
  ],
  "finland": [
    64.51,
    26.288
  ],
  "vietnam": [
    16.658,
    106.301
  ],
  "cambodia": [
    12.718,
    104.905
  ],
  "luxembourg": [
    49.767,
    6.072
  ],
  "united arab emirates": [
    23.904,
    54.31
  ],
  "belgium": [
    50.637,
    4.64
  ],
  "georgia": [
    42.169,
    43.508
  ],
  "north macedonia": [
    41.595,
    21.684
  ],
  "albania": [
    41.142,
    20.054
  ],
  "azerbaijan": [
    40.346,
    47.66
  ],
  "kosovo": [
    42.573,
    20.874
  ],
  "turkey": [
    38.99,
    35.424
  ],
  "spain": [
    40.39,
    -3.563
  ],
  "laos": [
    18.502,
    103.738
  ],
  "kyrgyzstan": [
    41.458,
    74.532
  ],
  "armenia": [
    40.289,
    44.932
  ],
  "denmark": [
    56.227,
    9.375
  ],
  "libya": [
    27.03,
    18.01
  ],
  "tunisia": [
    34.12,
    9.549
  ],
  "romania": [
    45.853,
    24.973
  ],
  "hungary": [
    47.163,
    19.397
  ],
  "slovakia": [
    48.705,
    19.48
  ],
  "poland": [
    52.125,
    19.394
  ],
  "ireland": [
    53.177,
    -8.138
  ],
  "united kingdom": [
    53.948,
    -2.519
  ],
  "greece": [
    39.475,
    22.582
  ],
  "zambia": [
    -13.46,
    27.774
  ],
  "sierra leone": [
    8.572,
    -11.787
  ],
  "guinea": [
    10.435,
    -10.943
  ],
  "liberia": [
    6.452,
    -9.32
  ],
  "central african republic": [
    6.566,
    20.465
  ],
  "sudan": [
    15.98,
    29.935
  ],
  "djibouti": [
    11.75,
    42.566
  ],
  "eritrea": [
    15.355,
    38.845
  ],
  "austria": [
    47.586,
    14.131
  ],
  "iraq": [
    33.04,
    43.745
  ],
  "italy": [
    43.523,
    12.155
  ],
  "switzerland": [
    46.799,
    8.215
  ],
  "iran": [
    32.577,
    54.276
  ],
  "netherlands": [
    52.282,
    5.639
  ],
  "liechtenstein": [
    47.138,
    9.541
  ],
  "ivory coast": [
    7.628,
    -5.569
  ],
  "republic of serbia": [
    44.222,
    20.789
  ],
  "mali": [
    17.344,
    -3.539
  ],
  "senegal": [
    14.368,
    -14.471
  ],
  "nigeria": [
    9.597,
    8.091
  ],
  "benin": [
    9.641,
    2.329
  ],
  "angola": [
    -12.331,
    17.564
  ],
  "croatia": [
    45.156,
    16.419
  ],
  "slovenia": [
    46.116,
    14.808
  ],
  "qatar": [
    25.313,
    51.187
  ],
  "saudi arabia": [
    24.124,
    44.539
  ],
  "botswana": [
    -22.186,
    23.799
  ],
  "zimbabwe": [
    -19.003,
    29.852
  ],
  "pakistan": [
    29.949,
    69.341
  ],
  "bulgaria": [
    42.769,
    25.218
  ],
  "thailand": [
    15.137,
    101.009
  ],
  "san marino": [
    43.936,
    12.442
  ],
  "haiti": [
    18.935,
    -72.677
  ],
  "dominican republic": [
    18.899,
    -70.5
  ],
  "chad": [
    15.333,
    18.646
  ],
  "kuwait": [
    29.32,
    47.565
  ],
  "el salvador": [
    13.736,
    -88.872
  ],
  "guatemala": [
    15.696,
    -90.36
  ],
  "east timor": [
    -8.804,
    125.937
  ],
  "brunei": [
    4.493,
    114.598
  ],
  "monaco": [
    43.74,
    7.399
  ],
  "algeria": [
    28.149,
    2.653
  ],
  "mozambique": [
    -17.268,
    35.537
  ],
  "eswatini": [
    -26.562,
    31.48
  ],
  "burundi": [
    -3.357,
    29.875
  ],
  "rwanda": [
    -1.993,
    29.919
  ],
  "myanmar": [
    21.214,
    96.489
  ],
  "bangladesh": [
    23.881,
    90.227
  ],
  "andorra": [
    42.541,
    1.561
  ],
  "afghanistan": [
    33.836,
    66.008
  ],
  "montenegro": [
    42.786,
    19.238
  ],
  "bosnia and herzegovina": [
    44.172,
    17.773
  ],
  "uganda": [
    1.276,
    32.367
  ],
  "us naval base guantanamo bay": [
    19.923,
    -75.124
  ],
  "cuba": [
    21.614,
    -78.958
  ],
  "honduras": [
    14.818,
    -86.625
  ],
  "ecuador": [
    -1.449,
    -78.387
  ],
  "colombia": [
    3.909,
    -73.081
  ],
  "paraguay": [
    -23.228,
    -58.398
  ],
  "brazilian island": [
    -30.188,
    -57.623
  ],
  "portugal": [
    39.681,
    -7.975
  ],
  "moldova": [
    47.195,
    28.461
  ],
  "turkmenistan": [
    39.116,
    59.377
  ],
  "jordan": [
    31.246,
    36.771
  ],
  "nepal": [
    28.248,
    83.916
  ],
  "lesotho": [
    -29.58,
    28.229
  ],
  "cameroon": [
    5.693,
    12.737
  ],
  "gabon": [
    -0.592,
    11.791
  ],
  "niger": [
    17.418,
    9.386
  ],
  "burkina faso": [
    12.27,
    -1.756
  ],
  "togo": [
    8.527,
    0.962
  ],
  "ghana": [
    7.954,
    -1.217
  ],
  "guinea-bissau": [
    12.057,
    -14.929
  ],
  "gibraltar": [
    36.129,
    -5.347
  ],
  "united states of america": [
    39.528,
    -99.144
  ],
  "canada": [
    57.939,
    -102.356
  ],
  "mexico": [
    23.942,
    -102.511
  ],
  "belize": [
    17.201,
    -88.704
  ],
  "panama": [
    8.522,
    -80.107
  ],
  "venezuela": [
    7.117,
    -66.184
  ],
  "papua new guinea": [
    -6.612,
    144.25
  ],
  "egypt": [
    26.493,
    29.86
  ],
  "yemen": [
    15.935,
    47.542
  ],
  "mauritania": [
    20.256,
    -10.342
  ],
  "equatorial guinea": [
    1.565,
    10.467
  ],
  "gambia": [
    13.45,
    -15.398
  ],
  "hong kong s.a.r.": [
    22.425,
    114.161
  ],
  "vatican": [
    41.903,
    12.453
  ],
  "northern cyprus": [
    35.277,
    33.599
  ],
  "cyprus no mans area": [
    35.101,
    33.253
  ],
  "siachen glacier": [
    35.391,
    77.18
  ],
  "baykonur cosmodrome": [
    45.978,
    63.384
  ],
  "akrotiri sovereign base area": [
    34.632,
    32.934
  ],
  "southern patagonian ice field": [
    -49.512,
    -73.319
  ],
  "bir tawil": [
    21.88,
    33.682
  ],
  "antarctica": [
    -80.562,
    20.821
  ],
  "australia": [
    -25.574,
    134.354
  ],
  "greenland": [
    74.759,
    -41.435
  ],
  "fiji": [
    -17.824,
    177.975
  ],
  "new zealand": [
    -43.984,
    170.52
  ],
  "new caledonia": [
    -21.326,
    165.487
  ],
  "madagascar": [
    -19.377,
    46.704
  ],
  "philippines": [
    15.953,
    121.418
  ],
  "sri lanka": [
    7.609,
    80.705
  ],
  "curaçao": [
    12.194,
    -68.971
  ],
  "aruba": [
    12.517,
    -69.974
  ],
  "bahamas": [
    24.704,
    -78.04
  ],
  "turks and caicos islands": [
    21.809,
    -71.742
  ],
  "taiwan": [
    23.753,
    120.964
  ],
  "japan": [
    36.651,
    137.972
  ],
  "saint pierre and miquelon": [
    46.952,
    -56.324
  ],
  "iceland": [
    64.998,
    -18.596
  ],
  "pitcairn islands": [
    -24.366,
    -128.317
  ],
  "french polynesia": [
    -17.664,
    -149.42
  ],
  "french southern and antarctic lands": [
    -49.311,
    69.501
  ],
  "seychelles": [
    -4.676,
    55.467
  ],
  "kiribati": [
    1.85,
    -157.371
  ],
  "marshall islands": [
    7.099,
    171.206
  ],
  "trinidad and tobago": [
    10.422,
    -61.294
  ],
  "grenada": [
    12.118,
    -61.679
  ],
  "saint vincent and the grenadines": [
    13.257,
    -61.194
  ],
  "barbados": [
    13.181,
    -59.561
  ],
  "saint lucia": [
    13.903,
    -60.97
  ],
  "dominica": [
    15.436,
    -61.357
  ],
  "united states minor outlying islands": [
    5.881,
    -162.077
  ],
  "montserrat": [
    16.738,
    -62.187
  ],
  "antigua and barbuda": [
    17.075,
    -61.79
  ],
  "saint kitts and nevis": [
    17.332,
    -62.758
  ],
  "united states virgin islands": [
    17.739,
    -64.763
  ],
  "saint barthelemy": [
    17.906,
    -62.833
  ],
  "puerto rico": [
    18.226,
    -66.481
  ],
  "anguilla": [
    18.225,
    -63.057
  ],
  "british virgin islands": [
    18.424,
    -64.622
  ],
  "jamaica": [
    18.155,
    -77.319
  ],
  "cayman islands": [
    19.318,
    -81.252
  ],
  "bermuda": [
    32.311,
    -64.762
  ],
  "heard island and mcdonald islands": [
    -53.089,
    73.505
  ],
  "saint helena": [
    -15.959,
    -5.717
  ],
  "mauritius": [
    -20.279,
    57.57
  ],
  "comoros": [
    -11.655,
    43.34
  ],
  "são tomé and principe": [
    0.236,
    6.608
  ],
  "cabo verde": [
    15.082,
    -23.637
  ],
  "malta": [
    35.891,
    14.441
  ],
  "jersey": [
    49.221,
    -2.127
  ],
  "guernsey": [
    49.463,
    -2.577
  ],
  "isle of man": [
    54.229,
    -4.534
  ],
  "aland": [
    60.229,
    19.944
  ],
  "faroe islands": [
    62.137,
    -6.987
  ],
  "indian ocean territories": [
    -10.493,
    105.663
  ],
  "british indian ocean territory": [
    -7.347,
    72.426
  ],
  "singapore": [
    1.359,
    103.813
  ],
  "norfolk island": [
    -29.035,
    167.955
  ],
  "cook islands": [
    -21.219,
    -159.787
  ],
  "tonga": [
    -21.172,
    -175.205
  ],
  "wallis and futuna": [
    -13.282,
    -176.162
  ],
  "samoa": [
    -13.631,
    -172.438
  ],
  "solomon islands": [
    -9.623,
    160.17
  ],
  "tuvalu": [
    -8.504,
    179.205
  ],
  "maldives": [
    4.191,
    73.508
  ],
  "nauru": [
    -0.521,
    166.933
  ],
  "federated states of micronesia": [
    6.883,
    158.234
  ],
  "south georgia and the islands": [
    -54.368,
    -36.684
  ],
  "falkland islands": [
    -51.735,
    -58.754
  ],
  "vanuatu": [
    -15.231,
    166.854
  ],
  "niue": [
    -19.049,
    -169.869
  ],
  "american samoa": [
    -14.305,
    -170.716
  ],
  "palau": [
    7.514,
    134.58
  ],
  "guam": [
    13.444,
    144.772
  ],
  "northern mariana islands": [
    15.184,
    145.741
  ],
  "bahrain": [
    26.053,
    50.547
  ],
  "coral sea islands": [
    -21.029,
    154.39
  ],
  "spratly islands": [
    10.73,
    115.822
  ],
  "clipperton island": [
    10.297,
    -109.221
  ],
  "macao s.a.r": [
    22.137,
    113.556
  ],
  "ashmore and cartier islands": [
    -12.433,
    123.586
  ],
  "bajo nuevo bank (petrel is.)": [
    15.795,
    -79.988
  ],
  "serranilla bank": [
    15.864,
    -78.638
  ],
  "scarborough reef": [
    15.152,
    117.754
  ]
};

/** 常见别名 -> 规范化国名（COUNTRY_CENTROIDS 的 key） */
const COUNTRY_ALIASES: Record<string, string> = {
  "usa": "united states of america",
  "us": "united states of america",
  "u.s.": "united states of america",
  "u.s.a.": "united states of america",
  "america": "united states of america",
  "united states": "united states of america",
  "states": "united states of america",
  "uk": "united kingdom",
  "u.k.": "united kingdom",
  "great britain": "united kingdom",
  "britain": "united kingdom",
  "england": "united kingdom",
  "russian federation": "russia",
  "the russian federation": "russia",
  "south korea": "south korea",
  "korea, republic of": "south korea",
  "republic of korea": "south korea",
  "north korea": "north korea",
  "korea, democratic people's republic of": "north korea",
  "dprk": "north korea",
  "iran, islamic republic of": "iran",
  "islamic republic of iran": "iran",
  "syrian arab republic": "syria",
  "the netherlands": "netherlands",
  "holland": "netherlands",
  "czech republic": "czechia",
  "republic of china": "taiwan",
  "hong kong": "hong kong",
  "macau": "macao",
  "macao": "macao",
  "viet nam": "vietnam",
  "laos, people's democratic republic": "laos",
  "myanmar": "myanmar",
  "burma": "myanmar",
  "united arab emirates": "united arab emirates",
  "saudi arabia": "saudi arabia",
  "turkey": "turkey",
  "turkiye": "turkey",
  "republic of turkey": "turkey",
  "bosnia and herzegovina": "bosnia and herzegovina",
  "croatia": "croatia",
  "ivory coast": "côte d'ivoire",
  "côte d'ivoire": "côte d'ivoire",
  "democratic republic of the congo": "democratic republic of the congo",
  "republic of the congo": "republic of the congo",
  "tanzania": "united republic of tanzania",
  "united republic of tanzania": "united republic of tanzania",
  "north macedonia": "north macedonia",
  "macedonia": "north macedonia",
  "eswatini": "eswatini",
  "swaziland": "eswatini",
  "cape verde": "cabo verde",
  "cabo verde": "cabo verde",
  "burkina faso": "burkina faso",
  "burkina": "burkina faso",
  "east timor": "timor-leste",
  "timor-leste": "timor-leste",
  "brunei": "brunei darussalam",
  "brunei darussalam": "brunei darussalam",
  "palestinian territories": "palestine",
  "west bank": "palestine",
  "gaza": "palestine",
  "kosovo": "kosovo"
};

function normalizeCountry(name: string): string {
  return (name || "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/^the\s+/, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** 根据文章国家字段返回地图坐标 [lat, lng]；先精确匹配，再查别名，都没有返回 null。 */
export function getCountryCenter(country: string | null | undefined): [number, number] | null {
  if (!country || !country.trim()) return null;
  const key = normalizeCountry(country);
  if (COUNTRY_CENTROIDS[key]) return COUNTRY_CENTROIDS[key];
  const aliased = COUNTRY_ALIASES[key];
  if (aliased && COUNTRY_CENTROIDS[aliased]) return COUNTRY_CENTROIDS[aliased];
  return null;
}

/** 文章是否具备可用于地图打点的国家（country 有值且能匹配到坐标） */
export function hasMappableCountry(country: string | null | undefined): boolean {
  return getCountryCenter(country) !== null;
}
