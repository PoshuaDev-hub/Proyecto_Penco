from rest_framework.permissions import BasePermission


def in_group(user, name):
    return user.is_authenticated and (user.is_superuser or user.groups.filter(name=name).exists())


class IsAdminRole(BasePermission):
    def has_permission(self, request, view):
        return in_group(request.user, 'Admin')


class IsRRHH(BasePermission):
    def has_permission(self, request, view):
        return in_group(request.user, 'RRHH') or in_group(request.user, 'Admin')


class IsPsicologo(BasePermission):
    def has_permission(self, request, view):
        return in_group(request.user, 'Psicologo') or in_group(request.user, 'Admin')


class IsComite(BasePermission):
    def has_permission(self, request, view):
        return in_group(request.user, 'Comite') or in_group(request.user, 'Admin')
