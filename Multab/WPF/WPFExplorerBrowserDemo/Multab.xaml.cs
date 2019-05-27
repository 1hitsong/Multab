//Copyright (c) Microsoft Corporation.  All rights reserved.

using System;
using System.Collections.Generic;
using System.Windows;
using System.Windows.Data;
using System.Windows.Controls;
using System.Linq;

using Microsoft.WindowsAPICodePack.Shell;
using Microsoft.WindowsAPICodePack.Controls;
using System.Windows.Markup;
using System.IO;
using System.Xml;
using Microsoft.WindowsAPICodePack.Controls.WindowsForms;
using System.Windows.Media;

namespace MulTab
{
    /// <summary>
    /// Interaction logic for Window1.xaml
    /// </summary>
    public partial class MainWindow : Window
    {
        public MainWindow()
        {
            InitializeComponent();

            var sortedKnownFolders =
                from folder in KnownFolders.All
                where (folder.CanonicalName != null &&
                    folder.CanonicalName.Length > 0 &&
                    ((ShellObject)folder).Thumbnail.BitmapSource != null &&
                    folder.CanonicalName.CompareTo("Network") != 0 &&
                    folder.CanonicalName.CompareTo("NetHood") != 0)
                orderby folder.CanonicalName
                select folder;

            this.Loaded += new RoutedEventHandler(ExplorerBrowserTestWindow_Loaded);
        }

        void ExplorerBrowserTestWindow_Loaded(object sender, RoutedEventArgs e)
        {
            TabItem item = new TabItem();
            item.Header = "Explorer";
            tabControl1.Items.Add(item);
            tabControl1.SelectedIndex = tabControl1.Items.Count - 1;
        }

        private void TabItem_Loaded(object sender, RoutedEventArgs e)
        {
            var tabItem = (sender as TabItem);

            if (null != tabItem.DataContext)
            {
                var dataTemplate = (DataTemplate)tabItem.FindResource("tabItemContent");
                var cp = new ContentPresenter();
                cp.ContentTemplate = dataTemplate;
                cp.Content = tabItem.DataContext;

                tabItem.Content = cp;
            }
        }

        private void newTab_Click(object sender, RoutedEventArgs e)
        {
            TabItem item = new TabItem();
            item.ContentTemplate = TryFindResource("tabItemContent") as DataTemplate;
            item.Header = "Explorer";
            tabControl1.Items.Add(item);
            tabControl1.SelectedIndex = tabControl1.Items.Count - 1;
        }

        private void closeTab_Click(object sender, RoutedEventArgs e)
        {
            tabControl1.Items.RemoveAt(tabControl1.SelectedIndex);
        }
    }

    public static class Enums
    {
        public static IEnumerable<T> Get<T>()
        {
            return System.Enum.GetValues(typeof(T)).Cast<T>();
        }
    }

    public class TriCheckToPaneVisibilityState : IValueConverter
    {
        #region IValueConverter Members

        public object Convert(object value, Type targetType, object parameter, System.Globalization.CultureInfo culture)
        {
            if (value == null)
                return PaneVisibilityState.DoNotCare;
            else if ((bool)value == true)
                return PaneVisibilityState.Show;
            else
                return PaneVisibilityState.Hide;
        }

        public object ConvertBack(object value, Type targetType, object parameter, System.Globalization.CultureInfo culture)
        {
            if ((PaneVisibilityState)value == PaneVisibilityState.DoNotCare)
                return null;
            else if ((PaneVisibilityState)value == PaneVisibilityState.Show)
                return true;
            else
                return false;
        }

        #endregion
    }

}
