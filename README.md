# mallorca-beach-live
Panel PWA de webcams en directo de las playas de Mallorca

## Pesca solunar de Mallorca

La app principal (`family/`) incluye una franja pequeña de siete días, con cuatro
semanas navegables y una escala de 1 a 5 estrellas. Destaca el mejor día y el de
menor índice de cada semana, según los valores sin redondear. No es un pronóstico
de capturas, de mareas reales ni del tiempo.

El cálculo se realiza para el centro de Mallorca (39.65 N, 3.00 E), con el día
local de `Europe/Madrid`, incluidos los cambios de hora. Se utiliza el algoritmo
público de [bite-times 1.1.1](https://github.com/benpaternostro/bite-times): fase y
distancia lunar, y coincidencia de periodos lunares con el amanecer/atardecer.
Se conservan sus cinco bandas: `<1.5`, `<2.5`, `<3.5`, `<4.25` y `>=4.25`.
Son índices orientativos; no tienen validación como predicción universal de pesca.
La [explicación original](https://www.solunar.com/solunar_theory) describe el
criterio tradicional. Las condiciones del agua, el tiempo y la especie también
influyen.

`node scripts/generate-solunar.cjs` genera 402 fechas consecutivas (dos anteriores
y 400 desde hoy), sin consultas a servicios externos ni envío de ubicaciones.
El control automático de cámaras renueva los datos y publica los cambios cada
dos días. Los datos van incluidos en la caché PWA para poder consultarlos sin
conexión. Si el intervalo disponible caduca, la interfaz lo indica sin inventar
estrellas. El navegador cambia el día según el horario de Mallorca, incluso si
el usuario está en otra zona horaria.

Los motores están fijados en `scripts/vendor/`; solo se ha cambiado la ruta del
`require` de bite-times para cargar suncalc3 2.0.5 localmente y se ha retirado su
referencia al mapa de fuentes. Sus licencias se conservan en `LICENSES.txt`.
Validación: `node --test scripts/solunar.test.cjs`.
