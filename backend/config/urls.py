from django.urls import include, path
from django.views.decorators.csrf import csrf_exempt
from graphene_django.views import GraphQLView
from graphql_jwt.decorators import jwt_cookie
from django.contrib import admin

urlpatterns = [
    path("api/admin/", admin.site.urls),
    path("api/users/", include("users.urls")),
    path("api/sales/", include("sales.urls")),
    path("api/admin_dash/", include("admin_dash.urls")),
]
