// sc_require('views/table_cell')

SC.TableRowView = SC.View.extend(SC.SimpleLayout, {
  backgroundColor: 'white',
  isPoolable: YES,
  layerIsCacheable: YES,
  thicknessKey: 'width',

  columnsBinding: '.parentView.columns',

  classNames: ['sc-dataview-row', 'sc-list-item-view'],
  
  render: function(context, firstTime) {
    if(firstTime) {
      var classArray = [];

      classArray.push((this.get('contentIndex') % 2 === 0) ? 'even' : 'odd');
      context.addClass(classArray);
    }
    sc_super();
  },
  
  // we'll handle layout from here-on-out thank you
  renderLayout: function(context, firstTime) {
    if(firstTime) sc_super();
  },
 
  _trv_columnsDidChange: function() {
    this.beginPropertyChanges();
    var cellViews = this._sc_cell_views || (this._sc_cell_views = []),
      columns = this.get('columns'),
      numCells = cellViews.get('length'),
      numCols = columns.get('length'), i;
      
    if(!this.get('columns')) return

    this.set('thicknesses', this.get('columns'))
    
    for(i = numCols; i < numCells; i++) {
      cellViews[i].destroy()
      cellViews.removeAt(i)
    }
    
    for(i = numCells; i < numCols; i++) {
      cell = this._createNewCellView(i);
      cellViews[i] = cell;
      this.appendChild(cell)
    }
    
    this.endPropertyChanges();
    this._updateCells();
  }.observes('columns'),

  awakeFromPool: function() {
    // striping
    var eo = (this.get('contentIndex') % 2 === 0) ? 'even' : 'odd';
    this.get('layer').className = this.get('classNames').join(" ") + " " + eo;

    this._updateCells();
  },
  
  _updateCells: function() {
    // cell updating
    // var columns = this.getPath('parentView.columns'),
    var columns = this.get('columns'),
      column, cell, E;
      
    for(var i = 0, len = columns.get('length'); i < len; i++) {
      column = columns.objectAt(i)
      this._updateCell(i, column);
    }
  },
  
  _updateCell: function(idx, column) {
    // this is faster than using bindings
    
    var cellView = this._sc_cell_views[idx];
    var contentView = cellView.get('contentView');
    
    cellView.beginPropertyChanges();
    contentView.beginPropertyChanges();
    
    if(cellView.get('column') != column) {
      cellView.set('column', column);
      cellView.set('columnIndex', idx);
      contentView.set('column', column);
      contentView.set('columnIndex', idx);
    }
    
    cellView.set('contentIndex', this.get('contentIndex'));
    cellView.set('layerId', this.get('layerId') + '-' + idx);
    contentView.set('contentIndex', this.get('contentIndex'));
    contentView.set('content', this.get('content'));
    contentView.set('layerId', this.get('layerId') + '-' + idx + '-content');

    contentView.endPropertyChanges();
    cellView.endPropertyChanges();
    return;
  },
  
  sleepInDOMPool: function() {
    if(this._hasSlept) return
      
    // why is the layer getting detached and why does this stop it?
    this._sc_cell_views.forEach(function(c) {
      c.get('contentView').get('layer');
    }, this);
    
    this._hasSlept = YES;
  },

  repositionView: function(view, layout) {
    if(!view) return
    
    var layer = view.get('layer'),
      transform;

    if (layer) {
      if(SC.isTouch) {
        transform = 'translate3d(' + layout.left + 'px, 0px,0) ';
        layer.style.left = '';
        layer.style.webkitTransform = transform;
        layer.style.webkitTransformOrigin = "top left";
      } else {
        layer.style.left = layout.left + "px";
      }
      layer.style.width = layout.width + "px";
    } else {
      view.adjust(layout);
    }
  },
  
  _createNewCellView: function(col) {
    var columns = this.get('columns'),
    // var columns = this.getPath('parentView.columns'),
      column = columns.objectAt(col),
      E = this.get('parentView').cellViewForColumn(col),
      wrapper = this.get('parentView').get('cellView'),
      attrs = {};
    
    attrs.parentView = this;
    attrs.layerId = this.get('layerId') + '-' + col;
    
    attrs.column = column;
    attrs.columnIndex = col;
    attrs.content = this.get('content');
    attrs.contentIndex = this.get('contentIndex');
    
    attrs.contentValueKey = column.get('key');
    // attrs.layout = this.layoutForCell(col);
    (attrs.classNames || (attrs.classNames = [])).push('column-' + col);

    return wrapper.create(attrs, {
      layoutDelegate: this,
      layoutIndex: col,
      childViews: ['contentView'],
      contentView: E.extend(attrs, {
        parentView: null, 
        layerId: attrs.layerId + '-content', 
        layout: {left: 10, right: 10}
      })
    });
  }

  
});