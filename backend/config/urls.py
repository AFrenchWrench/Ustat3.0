from django.urls import include, path
from django.views.decorators.csrf import csrf_exempt
from graphene_django.views import GraphQLView
from graphql_jwt.decorators import jwt_cookie
from django.contrib import admin

urlpatterns = [
    path("admin/", admin.site.urls),
    path("users/", include("users.urls")),
    path("sales/", include("sales.urls")),
]
