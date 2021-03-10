
#ifndef SERIAL_EXPORT_H
#define SERIAL_EXPORT_H

#ifdef SERIAL_BUILT_AS_STATIC
#  define SERIAL_EXPORT
#  define SERIAL_NO_EXPORT
#else
#  ifndef SERIAL_EXPORT
#    ifdef serial_EXPORTS
        /* We are building this library */
#      define SERIAL_EXPORT __attribute__((visibility("default")))
#    else
        /* We are using this library */
#      define SERIAL_EXPORT __attribute__((visibility("default")))
#    endif
#  endif

#  ifndef SERIAL_NO_EXPORT
#    define SERIAL_NO_EXPORT __attribute__((visibility("hidden")))
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
