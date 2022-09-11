# System Dynamic Diagrams with roughjs

rough_sysdyn_diagramm

You can draw System Dynamics diagrams in rough mode. 

# Use

rough_sysdyn_diagram can be used in three modes:

* Show the diagram imediatly
* Show the diagram as a film (with delay between each "frame")
* Show the System Dynamic diagram stepwise (forward and backward) by clicking a button 

If you choose option 2 or three you can show additional informations for your audience.

## Example 1: Show diagram imediatly

First you have to declare a drawing area and name it in this case *svg_123*:

    <div class="row mt-3">
        <div class="col-md-9">
            <svg id="svg_123" width="800px" height="600px" viewbox="0 0 800 600"></svg>
        </div>
    </div>

Here you see the script:

    <script>
        var svg_123_model = new RoughSd("svg_123")
        model = [
            ['Level', 'Mutter', 120, 150, false, true, false, false],
            ['Level', 'Tochter', 300, 150, false, true, false, false],
            ['Level', 'Endprod.', 480, 150, false, false],
            ['Const', 'Zerfall Mutter', 160 - 80 + 50, 300, BOTTOM],
            ['Const', 'Zerfall Tochter', 480 - 50, 50, TOP],

            ['Zerfall Mutter.top', 'Mutter.out_rate.bottom', -20],
            ['Zerfall Tochter.bottom', 'Tochter.out_rate.top', -10]
        ]
        svg_123_model.create_sd_model(model)
    </script>

First you create a new instance of the *RoughSd*-class with the id of your canvas (svg_123). 

    var svg_123_model = new RoughSd("svg_123")

Next you define your model as a list of objects:

Level objects use the following structure:
    
    [ 'Level', title, x, y, in-rate, out-rate, in-cloud, out-cloud]

With x and y you define the center of your symbol.

Consts objects have an easier structure:

    [ 'Const', title, x, y, position]

The position of your title can be LEFT, RIGHT, TOP or BOTTOM.

If you want to dependencies with a link you must declare the from- and the to-object and the bend of your link:

    [title of the from-object, title of the to-object, bend]

With *.top* or *.bottom* you declare the starting or ending point of your link:

    'Zerfall Mutter.top'

If you want to connect the Rates you use *in-rate* or *out-rate*:

    'Mutter.out_rate.bottom'

After closing your model list, you call 

    svg_123_model.create_sd_model(model)
    

## Example 2: Show diagram as a film

This example hast mostly the same structure as example 1. The drawing area in this case is svg_123b, so the name
of your RoughSd-class is called *svg_123b_model*.

The model is the same. To get a delay, you insert the number of seconds:

        model = [
            ['Level', 'Mutter', 120, 150, false, true, false, false,
                'Wir beginnen unsere Betrachtung mit einer radioaktiven Ausgangssubstanz, der sogenannten "Mutter"-Substanz'], 1,
            ['Const', 'Zerfall Mutter', 130, 300, BOTTOM,
                'Die Zerfallskonstante der Mutter bestimmt, wie schnell dieser Zerfall stattfindet.'], 1,
            ['Zerfall Mutter.top', 'Mutter.out_rate.bottom', -20,
                'Die Abnahme des Materials wird mit einem stilisierten Ventil dargestellt.'], 2,
            ['Level', 'Tochter', 300, 150, false, true, false, false,
                'Die beim Zerfall der Mutter-Substant entstehende Substanz ist ebenfalls radioaktiv. Diese Substanz nennen wir "Tochter"-Substanz.'], 1,
            ['Const', 'Zerfall Tochter', 480 - 50, 50, TOP,
                'Wie schnell diese Abnahme erfolgt, wird durch die Zerfallskostante der Tochter-Substanz bestimmt.'], 1,
            ['Zerfall Tochter.bottom', 'Tochter.out_rate.top', -20,
                'Die Abnahme des Materials wird mit einem stilisierten Ventil dargestellt.'], 2,
            ['Level', 'Endprod.', 480, 150, false, false, false, false,
                'Am Ende des gesamten Prozesses ist ein stabiles Endprodukt entstanden.']
        ]

The Level *Mutter* will be shown for 1 second, the Const *Zerfall Mutter* is visivible for another second, the
link between *Zerfall Mutter* and *Mutter.out_rate* will be shown for 2 seconds and so on.

If you show the diagram as a film, it is a good idea to explain every step. For example you could show the 
information *Die Zerfallskonstante der Mutter bestimmt, wie schnell dieser Zerfall stattfindet* for your
Const *Zerfall Mutter*.

If you are using such informations, you have to declare a div-area with the name canvas-id *_info*: *svg_123b_info*:

    <div class="row mt-3">
        <div class="col-md-9">
            <svg id="svg_123b" width="800px" height="600px" viewbox="0 0 800 600"></svg>
        </div>
        <div class="col-md-3">
            <div class="card" style="width: 18rem;">
                <div class="card-body">
                    <h5 class="card-title">Hinweise zum Diagramm</h5>
                    <div id="svg_123b_info">Bitte auf den Rechtspfeil klicken ...</div>
                </div>
            </div>
        </div>
    </div>

To see the full example look at the file index.html

## Example 3: Show diagram stepwise

To step through the model, you have to declare two buttons: *svg_123a_btn_prev* and *svg_123a_btn_next*. If you click
on the button, you call *svg_123a_model.draw_prev_obj()* or *svg_123a_model.draw_next_obj()*:

    <div class="row mt-3">
        <div class="col-md-9">
            <svg id="svg_123a" width="800px" height="600px" viewbox="0 0 800 600"></svg>
        </div>
        <div class="col-md-3">
            <div class="col-12 mb-3">
                <div class="btn-group" role="group" aria-label="forward / backward">
                    <button id="svg_123a_btn_prev" class="btn btn-light" onclick="svg_123a_model.draw_prev_obj()"><i class="fas fa-chevron-circle-left"></i></button>
                    <button id="svg_123a_btn_next" class="btn btn-light" onclick="svg_123a_model.draw_next_obj()"><i class="fas fa-chevron-circle-right"></i></button>
                </div>
            </div>
            <div class="card" style="width: 18rem;">
                <div class="card-body">
                    <h5 class="card-title">Hinweise zum Diagramm</h5>
                    <div id="svg_123a_info">Bitte auf den Rechtspfeil klicken ...</div>
                </div>
            </div>
        </div>
    </div>

The model is the same as in example 2, but you shouldn't insert delays.

Lastly you call

        svg_123a_model.create_sd_model(model, false)

With the *false*-param, the RoughSd-class "knows" to use forward- and backward-buttons.


# Python

To be done ...