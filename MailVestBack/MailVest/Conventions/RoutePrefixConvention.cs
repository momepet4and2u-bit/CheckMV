using System;
using System.Collections.Generic;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ApplicationModels;

namespace MailVest.Core.Conventions
{
    public class RoutePrefixConvention : IApplicationModelConvention
    {
        private readonly AttributeRouteModel _routePrefix;

        public RoutePrefixConvention(string prefix)
        {
            _routePrefix = new AttributeRouteModel(new RouteAttribute(prefix));
        }

        public void Apply(ApplicationModel application)
        {
            foreach (var controller in application.Controllers)
            {
                foreach(var selector in controller.Selectors)
                {
                    if (selector.AttributeRouteModel != null)
                    {
                        selector.AttributeRouteModel =
                            AttributeRouteModel.CombineAttributeRouteModel(_routePrefix, selector.AttributeRouteModel);
                    }
                    else
                    {
                        selector.AttributeRouteModel = _routePrefix;
                    }
                }
            }
        }
    }
}
