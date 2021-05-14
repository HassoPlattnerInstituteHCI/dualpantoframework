
#ifndef SERIAL_EXPORT_H
#define SERIAL_EXPORT_H

// figure out the correct attributes
#if defined _WIN32 || defined __CYGWIN__
  #define HELPER_DLL_IMPORT __declspec(dllimport)
  #define HELPER_DLL_EXPORT __declspec(dllexport)
  #define HELPER_DLL_LOCAL
#else
  #if __GNUC__ >= 4
    #define HELPER_DLL_IMPORT __attribute__ ((visibility ("default")))
    #define HELPER_DLL_EXPORT __attribute__ ((visibility ("default")))
    #define HELPER_DLL_LOCAL  __attribute__ ((visibility ("hidden")))
  #else
    #define HELPER_DLL_IMPORT
    #define HELPER_DLL_EXPORT
    #define HELPER_DLL_LOCAL
  #endif
#endif

#ifdef SERIAL_BUILT_AS_STATIC
#  define SERIAL_EXPORT
#  define SERIAL_NO_EXPORT
#else
#  ifndef SERIAL_EXPORT
#    ifdef serial_EXPORTS
        /* We are building this library */
#      define SERIAL_EXPORT HELPER_DLL_EXPORT
#    else
        /* We are using this library */
#      define SERIAL_EXPORT HELPER_DLL_EXPORT
#    endif
#  endif

#  ifndef SERIAL_NO_EXPORT
#    define SERIAL_NO_EXPORT HELPER_DLL_LOCAL
#  endif
#endif

#ifndef SERIAL_DEPRECATED
#  define SERIAL_DEPRECATED __attribute__ ((__deprecated__))
#endif

#ifndef SERIAL_DEPRECATED_EXPORT
#  define SERIAL_DEPRECATED_EXPORT SERIAL_EXPORT SERIAL_DEPRECATED
#endif

#ifndef SERIAL_DEPRECATED_NO_EXPORT
#  define SERIAL_DEPRECATED_NO_EXPORT SERIAL_NO_EXPORT SERIAL_DEPRECATED
#endif

#if 0 /* DEFINE_NO_DEPRECATED */
#  ifndef SERIAL_NO_DEPRECATED
#    define SERIAL_NO_DEPRECATED
#  endif
#endif

#endif /* SERIAL_EXPORT_H */
