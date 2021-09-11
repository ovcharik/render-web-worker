# https://ovcharik.github.io/render-web-worker/

Рендр 10 000 пинов на карте.

Версия кривая и недоделанная. Здесь скорее было желание посмотреть на то какие издержки будет создавать память при всех ограничениях веба для многопоточных вычислений. В итоге вообще вырезал версию с параллельными потоками, так как не нашел способа нормально бороться с накладными расходами.

![profiler-1](https://raw.githubusercontent.com/ovcharik/render-web-worker/master/images/screen1.png)
![profiler-2](https://raw.githubusercontent.com/ovcharik/render-web-worker/master/images/screen2.png)
![profiler-3](https://raw.githubusercontent.com/ovcharik/render-web-worker/master/images/screen3.png)

Понятно что сам основной поток при работе воркера не блокируется, но тут еще и сам воркер практически не оптимизирован и каждый раз производит вычисления для 10 000 точек.

PS. C координатами там что-то напутано, поэтому только для квадратного холста более менее адекватно считается. Альфа-маска тоже кривая, потому что там надо разбираться с порядком байт.
