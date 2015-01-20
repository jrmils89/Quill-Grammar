'use strict';

module.exports =
angular.module('quill-grammar.services.crud', [
  'firebase',
  'underscore',
])

.factory('CrudService', function(firebaseUrl, $firebase, $q, _) {
  function crud(entity, properties) {
    if (!properties) {
      properties = [];
    }
    if (firebaseUrl[firebaseUrl.length - 1] !== '/') {
      firebaseUrl = firebaseUrl + '/';
    }
    if (!entity || entity === '') {
      throw new Error('Firebase Entity MUST be defined');
    }
    var baseRoute = firebaseUrl + entity;
    var baseRef = $firebase(new Firebase(baseRoute));
    var baseCollection = baseRef.$asObject();

    function getRef() {
      return baseRef;
    }

    function sanitize(item) {
      if (properties && _.isObject(item)) {
        return _.pick(item, function(value, key) {
          return key[0] === '$' || _.contains(properties, key);
        });
      }
      return item;
    }

    function save(item) {
      var d = $q.defer();
      var entityItem = sanitize(item);
      baseRef.$push(entityItem).then(function(ref) {
        d.resolve(ref.key());
      }, function(error){
        d.reject(error);
      });
      return d.promise;
    }

    function del(item) {
      var d = $q.defer();
      if (!item || !item.$id) {
        throw new Error('Item doesn\'t have an $id property');
      }
      baseRef.$remove(item.$id).then(function(ref) {
        d.resolve(ref.key());
      }, function(error) {
        d.reject(error);
      });

      return d.promise;
    }

    function all() {
      var d = $q.defer();
      var a = baseRef.$asArray();
      a.$loaded().then(function() {
        d.resolve(a);
      }, function(error) {
        d.reject(error);
      });
      return d.promise;
    }

    function get(entityId) {
      var d = $q.defer();
      var entityRef = new Firebase(baseRoute + '/' + entityId);
      var entity = $firebase(entityRef).$asObject();
      entity.$loaded().then(function(entityData) {
        d.resolve(entityData);
      }, function(error) {
        d.reject(error);
      });
      return d.promise;
    }

    function update(item) {
      var d = $q.defer();
      baseCollection.$loaded().then(function() {
        var index = item.$id;
        baseCollection[index] = sanitize(item);
        baseCollection.$save(index).then(function(ref) {
          console.log(ref.key());
          d.resolve(ref.key());
        }, function(error){
          console.log(error);
          d.reject(error);
        });
      });
      return d.promise;
    }

    return {
      save: save,
      del: del,
      all: all,
      get: get,
      update: update,
      getRef: getRef,
    };
  }

  return crud;
});
