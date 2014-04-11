/*jshint forin:true, noarg:true, noempty:true, eqeqeq:false, bitwise:true, strict:true, undef:true, unused:true, curly:true, browser:true, jquery:true, indent:3, asi:false */
/*global apex:true */

/**
 * Check if namespace exists (<4.2) and create if no
 * If it exists (>=4.2) then extend namespace
 */
if ( apex.widget.tabular === null || typeof(apex.widget.tabular) != "object" ) { apex.widget.tabular = {}; };
(function( tabular, $ ) {
   tabular.gaColumnMapping = [];

   /**
    * Derives editable items in a tabular form from the apex-generated fmap elements,
    * and stores them in an array so they can be easily retrieved afterwards without
    * searching the dom again each time.
    * Also maps columns which do not appear in the fmap-mapping. These are usually
    * columns which are purely display-only.
    * Elements in the gaColumnMapping array have these properties:
    * - header
    * - name
    * - nodeName
    * - isMapped
    *
    * @example
    *
    * apex.widget.tabular.init_custom();
    *
    * @memberOf apex.widget.tabular
    */
   tabular.init_custom = function (){
      $( "input[name='fmap']" ).each( function ( index ) {
         var lsHeader   = $(this).val() ,
             lsName     = 'f'+('0'+(index+1)).slice(-2) ,
             lsNName    = $( "[name='" + lsName + "']" )[0].nodeName ,
             lbIsMapped = true ,
             lMap       = { "header"   : lsHeader ,
                            "name"     : lsName ,
                            "nodeName" : lsNName ,
                            "isMapped" : lbIsMapped
                          };
         tabular.gaColumnMapping.push(lMap);
      });

      /* for <4.2 compatibility */
      if ( tabular.gTabForm === null || typeof(tabular.gTabForm) != "object" ) {
         tabular.gTabForm = $("td[headers='" + tabular.gaColumnMapping[0].header + "']:eq(0)").closest("tbody");
      };

      /* Columns not mapped in the fmap array are no input items. These are likely to be simple display columns
       * Attempt to find these and add them to the array.
       * This is a loop over the TH elements in the tabular form. If no mapped item is found with a header matching
       * an ID of a column header, then this column is not represented in the map.
       * By adding these columns it is possible to retrieve display only items too.
       */
      $("th", tabular.gTabForm).each(function(){
         var lId = $(this).attr("id"),
             lExists = false;

         //Check if exists in mapping
         $(tabular.gaColumnMapping).each(function(){
            if ( this.header === lId ) {
               lExists = true;
               return false;
            };
         });

         //Does not exist in mapping yet - add it
         if ( !lExists ) {
            var lsHeader   = lId,
                lsName     = null,
                lsNName    = 'td',
                lbIsMapped = false,
                lMap       = { "header"   : lsHeader ,
                               "name"     : lsName ,
                               "nodeName" : lsNName ,
                               "isMapped" : lbIsMapped
                             };

            tabular.gaColumnMapping.push(lMap);
         };
      });
   };

   /**
    * Gets the name attribute associated with the given header. Essentially this
    * will return the associated array (f01, f02)
    * Ignores columns which are not mapped to an input type.
    *
    * @param {String} pHeader          The column header to retrieve the associated name for
    *
    * @return {String} the array name of the items with column header pHeader
    *
    * @example
    *
    * tabular.getNameWithHeader("SAL");
    *
    * @memberOf apex.widget.tabular
    */
   tabular.getNameWithHeader = function ( pHeader ) {
      var lsName;
      $.each(tabular.gaColumnMapping, function () {
         if ( this.isMapped && this.header == pHeader.toUpperCase() ) {
            lsName= this.name;
         };
      });
      return lsName;
   };

   /**
    * Gets the (column) header associated with the given name (array). There are multiple
    * items with the same name value in a tabular form, and this means that their values
    * will end up in the same array in apex. Usually f01, f02, ..., fnn
    * Ignores columns which are not mapped to an input type.
    *
    * @param {String} pName            Name associated with a series of items
    *
    * @return {String} The (column) header of the items in array pName
    *
    * @example
    *
    * tabular.getHeaderWithName("f02");
    *
    * @memberOf apex.widget.tabular
    */
   tabular.getHeaderWithName = function ( pName ) {
      var lsHeader;
      $.each(tabular.gaColumnMapping, function () {
         if ( this.isMapped && this.name.toUpperCase() == pName.toUpperCase() ) {
            lsHeader = this.header;
         };
      });
      return lsHeader;
   };

   /**
    * Constructs a selector that will target items associated with the given (column) header,
    * taking into account the possible item's nodename (eg input, select).
    * This selector will target all items associated, and not only the item on the same row.
    *
    * @param {String} pHeader        The column header to construct a selector for
    *
    * @return {String} a selector string for the item array associated with pHeader
    *
    * @example
    *
    * tabular.getSelector("ENAME");
    *
    * @memberOf apex.widget.tabular
    */
   tabular.getSelector = function ( pHeader ) {
      var lsSel ,
          lMap = tabular.getMapObject ( pHeader );
      if ( !!lMap ) {
         if ( lMap.isMapped ) {
            lsSel = lMap.nodeName + "[name='" + lMap.name + "']";
         } else {
            lsSel = lMap.nodeName + "[headers='" + lMap.header + "']";
         };
      }

      return lsSel;
   };

   /**
    * Gets the object stored in the array of editable items associated with the given (column) header
    *
    * @param {String} pHeader        The column header to find the associated item with
    *
    * @return {Object} the object stored in the array
    *
    * @example
    *
    * tabular.getMapObject("EMPNO");
    *
    * @memberOf apex.widget.tabular
    */
   tabular.getMapObject = function ( pHeader ) {
      var lRet;
      $.each(tabular.gaColumnMapping, function () {
         if ( this.header == pHeader.toUpperCase() ) {
            lRet = this;
         };
      });
      return lRet;
   };

   /**
    * Will return a jQuery object in the same row as pCurrentItem, and the input associated with pHeaderFind
    *
    * @param {String} pHeaderFind      The header of the column to find the item of
    * @param {DOM Element|jQuery Object} pCurrentItem
    *                                  A reference to an item for which to start the search from
    *
    * @return {Object}                 A jQuery object referencing the item in the same row as the
    *                                  provided pCurrentItem and in the column with header pHeaderFind
    *
    * @example
    *
    * tabular.getObjectInSameRow("ENAME", this.triggeringElement );
    *
    * @memberOf apex.widget.tabular
    */
   tabular.getObjectInSameRow = function ( pHeaderFind, pCurrentItem ) {
      return $(tabular.getSelector(pHeaderFind), $(pCurrentItem).closest("tr"));
   };

   /**
    * Makes an item in a tabular form as readonly by hiding the item and replacing it with a span-element that
    * displays the hidden item's value. This deals with several item types found in tabular forms such as text fields,
    * datepickers, select lists, checkboxes and popup lovs.
    * This will not set an input item as readonly. This will not remove elements from the dom.
    * Submitting a tabular form while an item has been set as readonly with this method will not cause a checksum error
    * as it would with removing the element from the HTML or setting a field as disabled.
    * Assigns the class "tfeReadonlyCell to the containing td element
    *
    * @param {Node|jQuery Object} pItem  The item to be rendered as readonly
    *
    * @example
    *
    * tabular.itemMakeReadonly ( this );
    *
    * @memberOf apex.widget.tabular
    */
   tabular.itemMakeReadonly = function ( pItem ) {
      var lItem = $(pItem),
          lDom = lItem.get(0);
      
      if ( ( !lItem.is(":visible") && !lItem.is(":hidden") ) || lItem.closest("td").hasClass("tfeReadonlyCell") ) {
         return true;
      };
      
      switch ( lDom.nodeName ) {
      case 'INPUT':
         switch ( lItem.attr('type') ) {
            case 'text':
               //LOVs, datepickers, text fields
               if ( lItem.parent("span").hasClass("lov") ) {
                  lItem.parent("span").before("<span class='itemDisable'>" + lItem.val() + "</span>").hide();
               }else if ( lItem.hasClass("hasDatepicker")||lItem.hasClass("datepicker") ) {
                  lItem.parent("span").before("<span class='itemDisable'>" + lItem.val() + "</span>").hide();
               } else {
                  lItem.before("<span class='itemDisable'>" + lItem.val() + "</span>").hide();
               };
            break;
            case 'checkbox':
               //create another checkbox which is disabled and has the item's value. This checkbox's value won't submit to session state.
               if ( lItem.parent().attr("headers") !== "CHECK$01" ) {
                  var ckrep = $("<input type='checkbox' class='itemDisable' />").prop("disabled", true).prop("checked", lItem.prop("checked"));
                  lItem.before(ckrep).hide();
               };
            break;
            case 'hidden':     
              //wizard checkboxes have a hidden input and a dummy checkbox.            
              lItem.siblings("input[name^="+lItem.attr("name")+"][type=checkbox]").each(function(){
                var ckrep = $("<input type='checkbox' class='itemDisable' />").prop("disabled", true).prop("checked", $(this).prop("checked"));
                $(this).before(ckrep).hide();
              });
            break;
         };
         break;
      case 'SELECT':
         //gets the display value from the current selected option
         lItem.before("<span class='itemDisable'>"+lItem.find("option:selected").text()+"</span>").hide();
         break;
      };
      
      $(pItem).closest("td").addClass("tfeReadonlyCell")
   };

   /**
    * Removes the readonly effect which has been applied with tabular.itemMakeReadonly from an item.
    *
    * @param {Node|jQuery Object} pItem  The item to remove the readonly effect from
    *
    * @example
    *
    * tabular.itemRemoveReadonly ( this );
    *
    * @memberOf apex.widget.tabular
    */
   tabular.itemRemoveReadonly = function ( pItem ) {
      var lToRemove = $(pItem).closest("td").removeClass("tfeReadonlyCell").find(".itemDisable");
      lToRemove.next().show();
      lToRemove.remove();
   };

   /**
    * Will set all visible editable items for the given row in a tabular form as readonly by using tabular.itemMakeReadonly
    * Assigns the class "tfeReadonlyRow" to the row element
    *
    * @param {Node|jQuery Object} pRow  The row element for which to set all its items as readonly for
    *
    * @example
    *
    * tabular.rowMakeReadonly ( $(this.triggeringElement).closest("tr") );
    *
    * @memberOf apex.widget.tabular
    */
   tabular.rowMakeReadonly = function ( pRow ) {
     $(pRow).addClass("tfeReadonlyRow");
     
     $(pRow).find("input[type='text']:visible,select:visible,input[type='checkbox']:visible").each( function () {
         tabular.itemMakeReadonly(this);
      });
   };

   /**
    * Removes the readonly effect which has been applied with tabular.itemMakeReadonly from all
    * editable items in the given row
    *
    * @param {Node|jQuery Object} pRow  The row element for which to remove the readonly effect on its items from
    *
    * @example
    *
    * tabular.rowRemoveReadonly ( $(this.triggeringElement).closest("tr") );
    *
    * @memberOf apex.widget.tabular
    */
   tabular.rowRemoveReadonly = function ( pRow ) {
      $(pRow).find("input").each(function () {
         tabular.itemRemoveReadonly(this);
      });

      $(pRow).find("select").each(function () {
         tabular.itemRemoveReadonly(this);
      });
      
      $(pRow).removeClass("tfeReadonlyRow");
   };
   
   /**
    * Toggles the readonly effect on the given row.
    *
    * @param {Node|jQuery Object} pRow  The row element for which to remove the readonly effect on its items from
    *
    * @example
    *
    * tabular.rowToggleReadonly ( $(this.triggeringElement).closest("tr") );
    *
    * @memberOf apex.widget.tabular
    */
   tabular.rowToggleReadonly = function ( pRow ) {
      if ( $(pRow).hasClass("tfeReadonlyRow") ) {
         tabular.rowRemoveReadonly ( pRow );
      } else {
         tabular.rowMakeReadonly ( pRow );
      };
   };
   
   /**
    * Toggles the readonly effect on the given item
    *
    * @param {Node|jQuery Object} pItem  The item to remove the readonly effect from
    *
    * @example
    *
    * tabular.itemToggleReadonly ( this );
    *
    * @memberOf apex.widget.tabular
    */
   tabular.itemToggleReadonly = function ( pItem ) {
      if ( $(pItem).closest("td").hasClass("tfeReadonlyCell") ) {
         tabular.itemRemoveReadonly ( pItem );
      } else {
         tabular.itemMakeReadonly ( pItem );
      };
   };
})(apex.widget.tabular, apex.jQuery);