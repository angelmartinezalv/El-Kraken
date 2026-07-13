@echo off
title Cocina - El Kraken

REM ------------------------------------------------------------------
REM  IMPORTANTE: cambia la siguiente linea por la IP real que te
REM  mostro la terminal de la computadora de CAJA al ejecutar
REM  "Iniciar_El_Kraken.bat" (algo como http://192.168.1.5:3000).
REM  Solo necesitas editarlo UNA VEZ; despues, doble clic y ya.
REM ------------------------------------------------------------------
set IP_DE_LA_CAJA=http://192.168.1.5:3000/cocina.html

start "" %IP_DE_LA_CAJA%
